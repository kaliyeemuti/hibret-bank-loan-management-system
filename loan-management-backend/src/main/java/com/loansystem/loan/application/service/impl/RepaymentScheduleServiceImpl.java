package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.response.RepaymentScheduleResponse;
import com.loansystem.loan.application.service.RepaymentScheduleService;
import com.loansystem.loan.application.service.NotificationService;
import com.loansystem.loan.domain.entity.*;
import com.loansystem.loan.domain.enums.*;
import com.loansystem.loan.domain.repository.*;
import com.loansystem.loan.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RepaymentScheduleServiceImpl implements RepaymentScheduleService {

    private final RepaymentScheduleRepository repaymentScheduleRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final LoanApplicationRepository loanApplicationRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CustomerAccountRepository customerAccountRepository;

    // ── Helper: resolve current authenticated user ───────────────────────────
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    // ── Helper: map loan product name to LoanType ────────────────────────────
    private LoanType mapProductToLoanType(String productName) {
        if (productName == null) throw new IllegalArgumentException("Loan product name cannot be null");
        String n = productName.toLowerCase();
        if (n.contains("personal"))               return LoanType.PERSONAL_LOAN;
        if (n.contains("business"))               return LoanType.BUSINESS_LOAN;
        if (n.contains("home"))                   return LoanType.HOME_LOAN;
        if (n.contains("auto") || n.contains("vehicle")) return LoanType.VEHICLE_LOAN;
        throw new IllegalArgumentException("Unknown loan product type: " + productName);
    }

    // ── Helper: map entity → DTO ─────────────────────────────────────────────
    private RepaymentScheduleResponse toDto(RepaymentSchedule rs) {
        LoanApplication loan = rs.getLoanApplication();
        BigDecimal rate = (loan != null && loan.getLoanProduct() != null)
                ? loan.getLoanProduct().getInterestRate()
                : null;
        return RepaymentScheduleResponse.builder()
                .id(rs.getId())
                .installmentNumber(rs.getInstallmentNumber())
                .dueDate(rs.getDueDate())
                .principalAmount(rs.getPrincipalAmount())
                .interestAmount(rs.getInterestAmount())
                .totalPayment(rs.getTotalPayment())
                .remainingBalance(rs.getRemainingBalance())
                .status(rs.getStatus() != null ? rs.getStatus().name() : "PENDING")
                .paidDate(rs.getPaidDate())
                .loanApplicationId(loan != null ? loan.getId() : null)
                .loanApplicationNumber(loan != null ? loan.getApplicationNumber() : null)
                .interestRate(rate)
                .build();
    }

    // ── getScheduleByLoanApplicationId ───────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<RepaymentSchedule> getScheduleByLoanApplicationId(Long loanApplicationId) {
        return repaymentScheduleRepository.findByLoanApplicationId(loanApplicationId);
    }

    // ── getMySchedules (customer-scoped) ─────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<RepaymentScheduleResponse> getMySchedules() {
        User currentUser = getAuthenticatedUser();
        return repaymentScheduleRepository.findByCustomerUser(currentUser)
                .stream()
                .map(this::toDto)
                .toList();
    }

    // ── payRepayment ─────────────────────────────────────────────────────────
    @Override
    @Transactional
    public RepaymentSchedule payRepayment(Long repaymentId, BigDecimal amount,
                                          String paymentMethod, String remarks) {

        // 1. Load installment
        RepaymentSchedule schedule = repaymentScheduleRepository.findById(repaymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Repayment schedule installment not found with id: " + repaymentId));

        // 2. Duplicate-payment guard
        if (schedule.getStatus() == RepaymentSchedule.PaymentStatus.PAID) {
            throw new IllegalArgumentException("This installment is already paid.");
        }

        // 3. Resolve loan + customer
        LoanApplication loan = schedule.getLoanApplication();
        if (loan == null) {
            throw new IllegalStateException("Repayment schedule installment has no associated loan application");
        }
        if (loan.getBusiness() == null || loan.getBusiness().getOwner() == null) {
            throw new IllegalStateException("Cannot resolve customer from loan application");
        }
        User customerUser = loan.getBusiness().getOwner().getUser();
        if (customerUser == null) {
            throw new IllegalStateException("Customer user not found for this loan application");
        }

        // 4. Use the installment's own totalPayment as the debit amount
        BigDecimal installmentAmount = schedule.getTotalPayment();

        // 5. Lock and validate Customer's MY ACCOUNT
        CustomerAccount repaymentAccount = customerAccountRepository
                .findByOwnerWithLock(customerUser)
                .orElseThrow(() -> new IllegalStateException("Customer account (My Account) not found"));

        BigDecimal repaymentBalance = repaymentAccount.getCurrentBalance() != null
                ? repaymentAccount.getCurrentBalance() : BigDecimal.ZERO;

        if (repaymentBalance.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException(
                    "No amount available to pay. Please deposit money into your Repayment Account first.");
        }
        if (repaymentBalance.compareTo(installmentAmount) < 0) {
            throw new IllegalArgumentException(String.format(
                    "Insufficient repayment balance. Required: %.2f ETB, Available: %.2f ETB.",
                    installmentAmount, repaymentBalance));
        }

        // 6. Debit Customer's REPAYMENT account
        repaymentAccount.setCurrentBalance(repaymentBalance.subtract(installmentAmount));
        customerAccountRepository.save(repaymentAccount);

        // 7. Credit the corresponding Bank loan account
        LoanType loanType = mapProductToLoanType(loan.getLoanProduct().getName());
        Account bankAccount = accountRepository.findByLoanType(loanType)
                .orElseThrow(() -> new IllegalStateException("Bank account for loan type not found"));

        BigDecimal balanceBefore = bankAccount.getCurrentBalance() != null
                ? bankAccount.getCurrentBalance() : BigDecimal.ZERO;
        BigDecimal balanceAfter = balanceBefore.add(installmentAmount);
        bankAccount.setCurrentBalance(balanceAfter);
        accountRepository.save(bankAccount);

        // 8. Mark installment PAID
        schedule.setStatus(RepaymentSchedule.PaymentStatus.PAID);
        schedule.setPaidDate(LocalDate.now());
        repaymentScheduleRepository.save(schedule);

        // 9. Create LOAN_REPAYMENT transaction
        BankTransaction transaction = BankTransaction.builder()
                .transactionType(TransactionType.LOAN_REPAYMENT)
                .amount(installmentAmount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .description("Repayment for installment #" + schedule.getInstallmentNumber()
                        + " of loan " + loan.getApplicationNumber())
                .transactionDate(LocalDateTime.now())
                .account(bankAccount)
                .loanApplication(loan)
                .loanProduct(loan.getLoanProduct())
                .customer(customerUser)
                .createdBy(customerUser)
                .repayment(schedule)
                .build();
        bankTransactionRepository.save(transaction);

        // 10. Check if all installments are now paid → mark loan COMPLETED
        List<RepaymentSchedule> allSchedules =
                repaymentScheduleRepository.findByLoanApplicationId(loan.getId());
        boolean hasAnyPending = allSchedules.stream()
                .anyMatch(s -> s.getStatus() != RepaymentSchedule.PaymentStatus.PAID
                               && !s.getId().equals(repaymentId));

        if (!hasAnyPending) {
            loan.setStatus(LoanApplicationStatus.COMPLETED);
            loanApplicationRepository.save(loan);
            customerUser.setEligibilityStatus(EligibilityStatus.ELIGIBLE);
            userRepository.save(customerUser);
            notificationService.sendNotification(customerUser, "Loan Fully Repaid!",
                    "Congratulations! Your loan " + loan.getApplicationNumber()
                            + " has been fully repaid and is now COMPLETED. "
                            + "You are now ELIGIBLE to apply for a new loan.",
                    "LOAN_COMPLETED");
        } else {
            notificationService.sendNotification(customerUser, "Repayment Recorded",
                    "Payment of " + installmentAmount + " ETB for installment #"
                            + schedule.getInstallmentNumber() + " of loan "
                            + loan.getApplicationNumber() + " was recorded successfully.",
                    "LOAN_REPAYMENT");
        }

        return schedule;
    }
}
