package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.request.LoanReviewRequest;
import com.loansystem.loan.application.dto.response.LoanReviewResponse;
import com.loansystem.loan.domain.entity.*;
import com.loansystem.loan.domain.repository.*;
import com.loansystem.loan.application.mapper.LoanReviewMapper;
import com.loansystem.loan.application.service.LoanReviewService;
import com.loansystem.loan.application.service.NotificationService;
import com.loansystem.loan.domain.enums.LoanApplicationStatus;
import com.loansystem.loan.domain.enums.ReviewDecision;
import com.loansystem.loan.domain.enums.Role;
import com.loansystem.loan.domain.enums.LoanType;
import com.loansystem.loan.domain.enums.TransactionType;
import com.loansystem.loan.domain.enums.EligibilityStatus;
import com.loansystem.loan.application.service.CustomerAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LoanReviewServiceImpl implements LoanReviewService {

    private final LoanReviewRepository reviewRepository;
    private final LoanApplicationRepository applicationRepository;
    private final LoanReviewMapper reviewMapper;
    private final LoanProductRepository loanProductRepository;
    private final RepaymentScheduleRepository repaymentScheduleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final BankTransactionRepository bankTransactionRepository;
    private final AccountRepository accountRepository;
    private final CustomerAccountService customerAccountService;
    private final CustomerAccountRepository customerAccountRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }



    /**
     * Finds the existing LoanReview for the given application and reviewer, or creates a new
     * (unsaved) instance. Prevents duplicate-key violations on re-submission.
     */
    private LoanReview resolveReview(LoanApplication application, User reviewer) {
        return reviewRepository.findByLoanApplication(application).stream()
                .filter(r -> r.getReviewer() != null && r.getReviewer().getId().equals(reviewer.getId()))
                .findFirst()
                .orElseGet(LoanReview::new);
    }

    /**
     * Maps a loan product name to its dedicated LoanType account.
     */
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
    public LoanReviewResponse reviewLoan(LoanReviewRequest request) {
        User reviewer = getAuthenticatedUser();
        LoanApplication application = applicationRepository.findById(request.getLoanApplicationId())
                .orElseThrow(() -> new RuntimeException("Loan application not found"));

        User customerUser = null;
        if (application.getBusiness() != null && application.getBusiness().getOwner() != null) {
            customerUser = application.getBusiness().getOwner().getUser();
        }

        if (application.getStatus() == LoanApplicationStatus.SUBMITTED) {
            if (reviewer.getRole() != Role.LOAN_OFFICER) {
                throw new RuntimeException("Only Loan Officers are allowed to review submitted applications.");
            }
            // ── Loan Officer review ──────────────────────────────────────────────
            LoanReview review = resolveReview(application, reviewer);
            review.setLoanApplication(application);
            review.setDecision(request.getDecision());
            review.setComments(request.getComments());
            review.setReviewer(reviewer);
            review.setReviewDate(LocalDateTime.now());
            reviewRepository.save(review);

            if (request.getDecision() == ReviewDecision.REQUEST_MORE_INFORMATION) {
                application.setStatus(LoanApplicationStatus.DRAFT);
                if (customerUser != null) {
                    notificationService.sendNotification(customerUser,
                            "Information Requested",
                            "The loan officer has requested more details for application "
                                    + application.getApplicationNumber() + ". Remarks: " + request.getComments(),
                            "MORE_INFORMATION_REQUESTED");
                }
            } else {
                application.setStatus(LoanApplicationStatus.UNDER_REVIEW);
                if (customerUser != null) {
                    notificationService.sendNotification(customerUser,
                            "Application Recommended",
                            "Your application " + application.getApplicationNumber()
                                    + " has been reviewed by the loan officer and forwarded for manager approval.",
                            "LOAN_UNDER_REVIEW");
                }
                List<User> managers = userRepository.findByRole(Role.MANAGER);
                for (User mgr : managers) {
                    notificationService.sendNotification(mgr,
                            "New Loan for Approval",
                            "Loan application " + application.getApplicationNumber() + " is ready for your decision.",
                            "LOAN_UNDER_REVIEW");
                }
            }
            applicationRepository.save(application);
            return reviewMapper.toResponse(review);

        } else if (application.getStatus() == LoanApplicationStatus.UNDER_REVIEW) {
            if (reviewer.getRole() != Role.MANAGER) {
                throw new RuntimeException("Only Managers are allowed to decide under review applications.");
            }
            // ── Manager review (final approval / rejection) ──────────────────────
            LoanReview review = resolveReview(application, reviewer);
            review.setLoanApplication(application);
            review.setDecision(request.getDecision());
            review.setComments(request.getComments());
            review.setReviewer(reviewer);
            review.setReviewDate(LocalDateTime.now());
            reviewRepository.save(review);

            application.setDecisionDate(LocalDateTime.now());
            application.setManagerRemarks(request.getComments());

            if (request.getDecision() == ReviewDecision.APPROVED) {
                application.setRejectionReason(null);

                // Mark customer NOT_ELIGIBLE while loan is active
                if (customerUser != null) {
                    customerUser.setEligibilityStatus(EligibilityStatus.NOT_ELIGIBLE);
                    userRepository.save(customerUser);
                }

                LoanProduct product = application.getLoanProduct();
                if (product == null) {
                    throw new IllegalStateException("Loan product is missing from application");
                }

                BigDecimal loanAmount = application.getRequestedAmount();
                if (loanAmount == null) {
                    throw new IllegalStateException("Requested amount is missing from application");
                }

                // Resolve the dedicated account for this loan type
                LoanType loanType = mapProductToLoanType(product.getName());
                Account account = accountRepository.findByLoanType(loanType).orElse(null);

                BigDecimal balanceBefore = BigDecimal.ZERO;
                BigDecimal balanceAfter = BigDecimal.ZERO;

                if (account != null) {
                    balanceBefore = account.getCurrentBalance() != null
                            ? account.getCurrentBalance() : BigDecimal.ZERO;
                    
                    if (balanceBefore.compareTo(loanAmount) < 0) {
                        throw new IllegalArgumentException("Insufficient bank balance for loan disbursement");
                    }
                    
                    balanceAfter = balanceBefore.subtract(loanAmount);
                    account.setCurrentBalance(balanceAfter);
                    accountRepository.save(account);
                } else {
                    throw new IllegalArgumentException("Bank account for loan type not found");
                }

                // Credit Customer's MY ACCOUNT (single unified account)
                if (customerUser != null) {
                    CustomerAccount myAccount = customerAccountService.getOrCreateAccount(customerUser);
                    myAccount.setCurrentBalance(myAccount.getCurrentBalance().add(loanAmount));
                    customerAccountRepository.save(myAccount);
                }

                application.setStatus(LoanApplicationStatus.DISBURSED);

                BankTransaction transaction = BankTransaction.builder()
                        .transactionType(TransactionType.LOAN_DISBURSEMENT)
                        .amount(loanAmount)
                        .balanceBefore(balanceBefore)
                        .balanceAfter(balanceAfter)
                        .description("Disbursement of loan " + application.getApplicationNumber()
                                + " (" + product.getName() + ")")
                        .transactionDate(LocalDateTime.now())
                        .account(account)
                        .loanApplication(application)
                        .loanProduct(product)
                        .customer(customerUser)
                        .createdBy(reviewer)
                        .build();
                bankTransactionRepository.save(transaction);

                generateRepaymentSchedule(application);
                applicationRepository.save(application);

                // ── Eligibility: auto-reject all other active applications ──────
                if (customerUser != null && application.getBusiness() != null) {
                    List<LoanApplicationStatus> activeStatuses = List.of(
                            LoanApplicationStatus.DRAFT,
                            LoanApplicationStatus.SUBMITTED,
                            LoanApplicationStatus.UNDER_REVIEW
                    );
                    List<LoanApplication> otherApps = applicationRepository
                            .findByBusinessAndStatusIn(application.getBusiness(), activeStatuses);

                    List<String> autoRejectedNumbers = new ArrayList<>();
                    for (LoanApplication other : otherApps) {
                        if (!other.getId().equals(application.getId())) {
                            other.setStatus(LoanApplicationStatus.REJECTED);
                            other.setRejectionReason(
                                    "Automatically rejected: another loan application ("
                                    + application.getApplicationNumber()
                                    + ") was approved for this customer.");
                            other.setDecisionDate(LocalDateTime.now());
                            applicationRepository.save(other);
                            autoRejectedNumbers.add(other.getApplicationNumber());
                        }
                    }

                    // Notify customer about auto-rejections and NOT_ELIGIBLE status
                    if (!autoRejectedNumbers.isEmpty()) {
                        String rejectedList = String.join(", ", autoRejectedNumbers);
                        notificationService.sendNotification(customerUser,
                                "Loan Application Update",
                                "Your loan application " + application.getApplicationNumber()
                                        + " has been approved and disbursed. "
                                        + "As a result, the following pending applications were automatically rejected: "
                                        + rejectedList + ". "
                                        + "Your account is currently NOT ELIGIBLE for another loan. "
                                        + "Please contact an administrator if you need to become eligible again.",
                                "AUTO_REJECTED_OTHER_APPLICATIONS");

                        // Notify loan officers and managers about the auto-rejections
                        List<User> officers = userRepository.findByRole(Role.LOAN_OFFICER);
                        for (User officer : officers) {
                            notificationService.sendNotification(officer,
                                    "Applications Auto-Rejected",
                                    "Applications " + rejectedList
                                            + " belonging to customer " + customerUser.getFullName()
                                            + " were automatically rejected because application "
                                            + application.getApplicationNumber() + " was approved.",
                                    "AUTO_REJECTED_OTHER_APPLICATIONS");
                        }
                        List<User> managers = userRepository.findByRole(Role.MANAGER);
                        for (User mgr : managers) {
                            notificationService.sendNotification(mgr,
                                    "Applications Auto-Rejected",
                                    "Applications " + rejectedList
                                            + " belonging to customer " + customerUser.getFullName()
                                            + " were automatically rejected because application "
                                            + application.getApplicationNumber() + " was approved.",
                                    "AUTO_REJECTED_OTHER_APPLICATIONS");
                        }
                    } else {
                        // No other active apps but still notify about eligibility
                        notificationService.sendNotification(customerUser,
                                "Loan Disbursed!",
                                "Congratulations! Your application " + application.getApplicationNumber()
                                        + " has been approved and DISBURSED. Repayment schedule has been generated. "
                                        + "Your account is now NOT ELIGIBLE for another loan until an administrator restores your eligibility.",
                                "LOAN_DISBURSED");
                    }
                } else {
                    notificationService.sendNotification(customerUser,
                            "Loan Disbursed!",
                            "Congratulations! Your application " + application.getApplicationNumber()
                                    + " has been approved and DISBURSED. Repayment schedule has been generated.",
                            "LOAN_DISBURSED");
                }

            } else if (request.getDecision() == ReviewDecision.REJECTED) {
                application.setStatus(LoanApplicationStatus.REJECTED);
                application.setRejectionReason(request.getComments());
                applicationRepository.save(application);

                if (customerUser != null) {
                    notificationService.sendNotification(customerUser,
                            "Application Rejected",
                            "We regret to inform you that your application "
                                    + application.getApplicationNumber()
                                    + " has been rejected. Remarks: " + request.getComments(),
                            "LOAN_REJECTED");
                }

            } else if (request.getDecision() == ReviewDecision.REQUEST_MORE_INFORMATION) {
                application.setStatus(LoanApplicationStatus.DRAFT);
                applicationRepository.save(application);

                if (customerUser != null) {
                    notificationService.sendNotification(customerUser,
                            "Information Requested",
                            "The manager has requested more details for application "
                                    + application.getApplicationNumber()
                                    + ". Remarks: " + request.getComments(),
                            "MORE_INFORMATION_REQUESTED");
                }
            }

            return reviewMapper.toResponse(review);

        } else {
            throw new RuntimeException("Application is not in a reviewable state");
        }
    }

    private void generateRepaymentSchedule(LoanApplication application) {
        LoanProduct product = application.getLoanProduct();
        if (product == null) {
            throw new RuntimeException("Loan product not found for application");
        }

        BigDecimal loanAmount = application.getRequestedAmount();
        BigDecimal annualInterestRate = product.getInterestRate();
        Integer repaymentPeriodMonths = product.getRepaymentPeriodMonths();

        if (loanAmount == null || annualInterestRate == null || repaymentPeriodMonths == null) {
            throw new RuntimeException("Missing loan details for schedule generation");
        }

        // Monthly interest rate
        BigDecimal monthlyInterestRate = annualInterestRate
                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);

        // Monthly payment: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyInterestRate);
        BigDecimal rPowN = onePlusR.pow(repaymentPeriodMonths);
        BigDecimal monthlyPayment = loanAmount
                .multiply(monthlyInterestRate.multiply(rPowN))
                .divide(rPowN.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);

        BigDecimal remainingBalance = loanAmount;
        LocalDate dueDate = LocalDate.now().plusMonths(1);
        List<RepaymentSchedule> schedules = new ArrayList<>();

        for (int i = 1; i <= repaymentPeriodMonths; i++) {
            BigDecimal interestPayment = remainingBalance
                    .multiply(monthlyInterestRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalPayment = monthlyPayment
                    .subtract(interestPayment).setScale(2, RoundingMode.HALF_UP);

            // Adjust final instalment to clear rounding residual
            if (i == repaymentPeriodMonths) {
                principalPayment = remainingBalance;
                monthlyPayment = principalPayment.add(interestPayment);
            }

            remainingBalance = remainingBalance.subtract(principalPayment).setScale(2, RoundingMode.HALF_UP);
            if (remainingBalance.compareTo(BigDecimal.ZERO) < 0) {
                remainingBalance = BigDecimal.ZERO;
            }

            schedules.add(RepaymentSchedule.builder()
                    .loanApplication(application)
                    .installmentNumber(i)
                    .dueDate(dueDate)
                    .principalAmount(principalPayment)
                    .interestAmount(interestPayment)
                    .totalPayment(monthlyPayment)
                    .remainingBalance(remainingBalance)
                    .status(RepaymentSchedule.PaymentStatus.PENDING)
                    .build());

            dueDate = dueDate.plusMonths(1);
        }

        repaymentScheduleRepository.saveAll(schedules);
    }

    @Override
    public List<LoanReviewResponse> getAllReviews() {
        return reviewRepository.findAll()
                .stream()
                .map(reviewMapper::toResponse)
                .toList();
    }
}
