package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.service.RepaymentScheduleService;
import com.loansystem.loan.application.service.NotificationService;
import com.loansystem.loan.domain.entity.BankTransaction;
import com.loansystem.loan.domain.entity.LoanApplication;
import com.loansystem.loan.domain.entity.RepaymentSchedule;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.LoanApplicationStatus;
import com.loansystem.loan.domain.enums.LoanType;
import com.loansystem.loan.domain.repository.BankTransactionRepository;
import com.loansystem.loan.domain.repository.LoanApplicationRepository;
import com.loansystem.loan.domain.repository.RepaymentScheduleRepository;
import com.loansystem.loan.domain.repository.UserRepository;
import com.loansystem.loan.domain.repository.AccountRepository;
import com.loansystem.loan.domain.repository.CustomerAccountRepository;
import com.loansystem.loan.domain.entity.Account;
import com.loansystem.loan.domain.entity.CustomerAccount;
import com.loansystem.loan.domain.enums.CustomerAccountType;
import com.loansystem.loan.domain.enums.EligibilityStatus;
import com.loansystem.loan.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
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

    private LoanType mapProductToLoanType(String productName) {
        if (productName == null) {
            throw new IllegalArgumentException("Loan product name cannot be null");
        }
        String normalized = productName.toLowerCase();
        if (normalized.contains("personal")) {
            return LoanType.PERSONAL_LOAN;
        } else if (normalized.contains("business")) {
            return LoanType.BUSINESS_LOAN;
        } else if (normalized.contains("home")) {
            return LoanType.HOME_LOAN;
        } else if (normalized.contains("auto") || normalized.contains("vehicle")) {
            return LoanType.VEHICLE_LOAN;
        } else {
            throw new IllegalArgumentException("Unknown loan product type: " + productName);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepaymentSchedule> getScheduleByLoanApplicationId(Long loanApplicationId) {
        return repaymentScheduleRepository.findByLoanApplicationId(loanApplicationId);
    }

    @Override
    @Transactional
    public RepaymentSchedule payRepayment(Long repaymentId, BigDecimal amount, String paymentMethod, String remarks) {
        RepaymentSchedule schedule = repaymentScheduleRepository.findById(repaymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Repayment schedule installment not found with id: " + repaymentId));

        if (schedule.getStatus() == RepaymentSchedule.PaymentStatus.PAID) {
            throw new IllegalArgumentException("Repayment schedule installment is already paid");
        }

        LoanApplication loan = schedule.getLoanApplication();
        if (loan == null) {
            throw new IllegalStateException("Repayment schedule installment has no associated loan application");
        }

        List<RepaymentSchedule> allSchedules = repaymentScheduleRepository.findByLoanApplicationId(loan.getId());
        BigDecimal totalOutstanding = allSchedules.stream()
                .filter(s -> s.getStatus() != RepaymentSchedule.PaymentStatus.PAID)
                .map(RepaymentSchedule::getTotalPayment)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (amount.compareTo(totalOutstanding) > 0) {
            throw new IllegalArgumentException("Repayment amount " + amount + " exceeds the remaining loan balance of " + totalOutstanding);
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Repayment amount must be greater than zero");
        }
        
        User customerUser = null;
        if (loan.getBusiness() != null && loan.getBusiness().getOwner() != null) {
            customerUser = loan.getBusiness().getOwner().getUser();
        }

        if (customerUser == null) {
            throw new IllegalStateException("Repayment cannot be processed because customer is not found.");
        }

        // Lock and debit Customer's REPAYMENT account
        CustomerAccount repaymentAccount = customerAccountRepository.findByOwnerAndTypeWithLock(customerUser, CustomerAccountType.REPAYMENT)
                .orElseThrow(() -> new IllegalStateException("Customer repayment account not found"));

        if (repaymentAccount.getCurrentBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance in repayment account");
        }

        repaymentAccount.setCurrentBalance(repaymentAccount.getCurrentBalance().subtract(amount));
        customerAccountRepository.save(repaymentAccount);

        // Credit Bank's Loan Account
        LoanType loanType = mapProductToLoanType(loan.getLoanProduct().getName());
        Account bankAccount = accountRepository.findByLoanType(loanType)
                .orElseThrow(() -> new IllegalStateException("Bank account for loan type not found"));

        BigDecimal balanceBefore = bankAccount.getCurrentBalance() != null ? bankAccount.getCurrentBalance() : BigDecimal.ZERO;
        BigDecimal balanceAfter = balanceBefore.add(amount);
        bankAccount.setCurrentBalance(balanceAfter);
        accountRepository.save(bankAccount);

        schedule.setStatus(RepaymentSchedule.PaymentStatus.PAID);
        schedule.setPaidDate(LocalDate.now());
        repaymentScheduleRepository.save(schedule);

        BankTransaction transaction = BankTransaction.builder()
                .transactionType(com.loansystem.loan.domain.enums.TransactionType.LOAN_REPAYMENT)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .description("Repayment for installment #" + schedule.getInstallmentNumber() + " of loan " + loan.getApplicationNumber())
                .transactionDate(LocalDateTime.now())
                .loanApplication(loan)
                .loanProduct(loan.getLoanProduct())
                .customer(loan.getBusiness() != null && loan.getBusiness().getOwner() != null ? loan.getBusiness().getOwner().getUser() : null)
                .createdBy(loan.getBusiness() != null && loan.getBusiness().getOwner() != null ? loan.getBusiness().getOwner().getUser() : null)
                .repayment(schedule)
                .build();
        bankTransactionRepository.save(transaction);

        // Check if all installments are paid to mark the loan as COMPLETED
        boolean hasPendingInstallments = allSchedules.stream()
                .anyMatch(s -> s.getStatus() != RepaymentSchedule.PaymentStatus.PAID && !s.getId().equals(repaymentId));

        if (!hasPendingInstallments) {
            loan.setStatus(LoanApplicationStatus.COMPLETED);
            loanApplicationRepository.save(loan);

            // Notify customer
            if (loan.getBusiness() != null && loan.getBusiness().getOwner() != null) {
                User customer = loan.getBusiness().getOwner().getUser();
                if (customer != null) {
                    customer.setEligibilityStatus(EligibilityStatus.ELIGIBLE);
                    userRepository.save(customer);
                    notificationService.sendNotification(customer, "Loan Fully Repaid!",
                            "Congratulations! Your loan " + loan.getApplicationNumber() + " has been fully repaid and is now COMPLETED.",
                            "LOAN_COMPLETED");
                }
            }
        } else {
            // Notify customer about successful installment payment
            if (loan.getBusiness() != null && loan.getBusiness().getOwner() != null) {
                User customer = loan.getBusiness().getOwner().getUser();
                if (customer != null) {
                    notificationService.sendNotification(customer, "Repayment Recorded",
                            "Payment of " + amount + " ETB for installment #" + schedule.getInstallmentNumber() + " of loan " + loan.getApplicationNumber() + " was recorded successfully.",
                            "LOAN_REPAYMENT");
                }
            }
        }

        return schedule;
    }
}
