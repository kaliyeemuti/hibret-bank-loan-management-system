package com.loansystem.loan.application.service.impl;
import com.loansystem.loan.application.dto.response.LoanApplicationResponse;
import com.loansystem.loan.application.dto.response.BankTransactionResponse;
import com.loansystem.loan.application.mapper.LoanApplicationMapper;

import com.loansystem.loan.domain.enums.ReviewDecision;
import com.loansystem.loan.domain.enums.Role;
import com.loansystem.loan.application.service.DashboardService;
import com.loansystem.loan.domain.entity.*;
import com.loansystem.loan.domain.enums.LoanApplicationStatus;
import com.loansystem.loan.domain.repository.*;
import com.loansystem.loan.domain.enums.LoanType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final LoanApplicationRepository applicationRepository;
    private final RepaymentScheduleRepository repaymentScheduleRepository;
    private final NotificationRepository notificationRepository;
    private final BusinessRepository businessRepository;
    private final BusinessOwnerRepository businessOwnerRepository;
    private final LoanProductRepository loanProductRepository;
    private final LoanReviewRepository reviewRepository;
    private final LoanApplicationMapper applicationMapper;
    private final BankTransactionRepository bankTransactionRepository;
    private final AccountRepository accountRepository;


    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private Business getOrCreateCustomerBusiness(User user) {
        BusinessOwner owner = businessOwnerRepository.findByUser(user)
                .orElseGet(() -> {
                    BusinessOwner newOwner = new BusinessOwner();
                    newOwner.setUser(user);
                    newOwner.setFirstName(user.getFirstName());
                    newOwner.setLastName(user.getLastName());
                    newOwner.setEmail(user.getEmail());
                    newOwner.setPhoneNumber(user.getPhoneNumber());
                    return businessOwnerRepository.save(newOwner);
                });

        List<Business> businesses = businessRepository.findByOwner(owner);
        if (businesses.isEmpty()) {
            Business newBusiness = new Business();
            newBusiness.setOwner(owner);
            newBusiness.setBusinessName(user.getFirstName() + "'s Business");
            newBusiness.setBusinessType("General Services");
            newBusiness.setAddress("Addis Ababa, Ethiopia");
            newBusiness.setPhoneNumber(user.getPhoneNumber());
            newBusiness.setEmail(user.getEmail());
            return businessRepository.save(newBusiness);
        }
        return businesses.get(0);
    }

    @Override
    public Map<String, Object> getCustomerStats() {
        User user = getAuthenticatedUser();
        Business business = getOrCreateCustomerBusiness(user);

        // Fetch applications for this business
        List<LoanApplication> applications = applicationRepository.findAll().stream()
                .filter(app -> app.getBusiness() != null && app.getBusiness().getId().equals(business.getId()))
                .toList();

        int totalApplications = applications.size();
        long approvedLoans = applications.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.APPROVED
                            || app.getStatus() == LoanApplicationStatus.DISBURSED)
                .count();
        long pendingLoans = applications.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.SUBMITTED
                            || app.getStatus() == LoanApplicationStatus.UNDER_REVIEW)
                .count();
        // Active = approved + disbursed (loan funds already released)
        long activeLoans = applications.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.DISBURSED)
                .count();

        // Calculate balances and repayment progress from RepaymentSchedule
        BigDecimal remainingBalance = BigDecimal.ZERO;
        BigDecimal nextRepaymentAmount = BigDecimal.ZERO;
        LocalDate nextRepaymentDate = null;
        long totalInstallments = 0;
        long paidInstallments = 0;

        List<RepaymentSchedule> schedules = new ArrayList<>();
        for (LoanApplication app : applications) {
            if (app.getStatus() == LoanApplicationStatus.APPROVED
                    || app.getStatus() == LoanApplicationStatus.DISBURSED) {
                schedules.addAll(repaymentScheduleRepository.findByLoanApplicationId(app.getId()));
            }
        }

        totalInstallments = schedules.size();
        paidInstallments = schedules.stream().filter(s -> s.getStatus() == RepaymentSchedule.PaymentStatus.PAID).count();

        // Get next pending installment
        List<RepaymentSchedule> pendingSchedules = schedules.stream()
                .filter(s -> s.getStatus() == RepaymentSchedule.PaymentStatus.PENDING || s.getStatus() == RepaymentSchedule.PaymentStatus.OVERDUE)
                .sorted(Comparator.comparing(RepaymentSchedule::getDueDate))
                .toList();

        if (!pendingSchedules.isEmpty()) {
            RepaymentSchedule next = pendingSchedules.get(0);
            nextRepaymentAmount = next.getTotalPayment();
            nextRepaymentDate = next.getDueDate();
        }

        for (RepaymentSchedule s : pendingSchedules) {
            remainingBalance = remainingBalance.add(s.getTotalPayment());
        }

        double repaymentProgress = totalInstallments > 0 ? ((double) paidInstallments / totalInstallments) * 100.0 : 0.0;

        // Build status distribution map
        Map<String, Integer> statusDistribution = new HashMap<>();
        for (LoanApplicationStatus status : LoanApplicationStatus.values()) {
            statusDistribution.put(status.name(), 0);
        }
        for (LoanApplication app : applications) {
            String statusName = app.getStatus().name();
            statusDistribution.put(statusName, statusDistribution.getOrDefault(statusName, 0) + 1);
        }

        // Build monthly repayments (group paid repayments by month of due date)
        Map<String, BigDecimal> monthlyRepayments = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        // Seed last 6 months in map
        LocalDate dateCursor = LocalDate.now().minusMonths(5);
        for (int i = 0; i < 6; i++) {
            monthlyRepayments.put(dateCursor.format(formatter), BigDecimal.ZERO);
            dateCursor = dateCursor.plusMonths(1);
        }

        for (RepaymentSchedule s : schedules) {
            if (s.getStatus() == RepaymentSchedule.PaymentStatus.PAID && s.getDueDate() != null) {
                String monthKey = s.getDueDate().format(formatter);
                if (monthlyRepayments.containsKey(monthKey)) {
                    monthlyRepayments.put(monthKey, monthlyRepayments.get(monthKey).add(s.getTotalPayment()));
                } else {
                    // Just in case it is outside the last 6 months but we want to show it
                    monthlyRepayments.put(monthKey, s.getTotalPayment());
                }
            }
        }

        // Fetch recent notifications
        List<Notification> recentNotifications = notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .limit(5)
                .toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalApplications", totalApplications);
        stats.put("approvedLoans", approvedLoans);
        stats.put("pendingLoans", pendingLoans);
        stats.put("activeLoans", activeLoans);
        stats.put("remainingBalance", remainingBalance);
        stats.put("nextRepaymentAmount", nextRepaymentAmount);
        stats.put("nextRepaymentDate", nextRepaymentDate != null ? nextRepaymentDate.toString() : null);
        stats.put("repaymentProgress", repaymentProgress);
        stats.put("statusDistribution", statusDistribution);
        stats.put("monthlyRepayments", monthlyRepayments);
        stats.put("recentNotifications", recentNotifications);

        return stats;
    }

    @Override
    public Map<String, Object> getLoanOfficerStats() {
        List<LoanApplication> allApps = applicationRepository.findAll();
        long totalAssignedApplications = allApps.stream()
                .filter(app -> app.getStatus() != LoanApplicationStatus.DRAFT)
                .count();

        long awaitingReview = allApps.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.SUBMITTED)
                .count();

        long underReview = allApps.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.UNDER_REVIEW)
                .count();

        long overdueRepayments = repaymentScheduleRepository.findAll().stream()
                .filter(s -> s.getStatus() == RepaymentSchedule.PaymentStatus.OVERDUE)
                .count();

        List<LoanReview> allReviews = reviewRepository.findAll();
        long recommendedApprovals = allReviews.stream()
                .filter(r -> r.getReviewer() != null && r.getReviewer().getRole() == Role.LOAN_OFFICER && r.getDecision() == ReviewDecision.APPROVED)
                .count();

        long recommendedRejections = allReviews.stream()
                .filter(r -> r.getReviewer() != null && r.getReviewer().getRole() == Role.LOAN_OFFICER && r.getDecision() == ReviewDecision.REJECTED)
                .count();

        long todayReviews = allReviews.stream()
                .filter(r -> r.getReviewDate() != null && r.getReviewDate().toLocalDate().isEqual(LocalDate.now()))
                .count();

        // statusDistribution
        Map<String, Integer> statusDistribution = new HashMap<>();
        for (LoanApplicationStatus status : LoanApplicationStatus.values()) {
            statusDistribution.put(status.name(), 0);
        }
        for (LoanApplication app : allApps) {
            String statusName = app.getStatus().name();
            statusDistribution.put(statusName, statusDistribution.getOrDefault(statusName, 0) + 1);
        }

        // applicationsByMonth (group by month chronologically for last 6 months)
        Map<String, Long> applicationsByMonth = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        LocalDate dateCursor = LocalDate.now().minusMonths(5);
        for (int i = 0; i < 6; i++) {
            applicationsByMonth.put(dateCursor.format(formatter), 0L);
            dateCursor = dateCursor.plusMonths(1);
        }
        for (LoanApplication app : allApps) {
            if (app.getStatus() != LoanApplicationStatus.DRAFT && app.getApplicationDate() != null) {
                String monthKey = app.getApplicationDate().format(formatter);
                if (applicationsByMonth.containsKey(monthKey)) {
                    applicationsByMonth.put(monthKey, applicationsByMonth.get(monthKey) + 1);
                }
            }
        }

        // reviewPerformance (group reviews by month chronologically for last 6 months)
        Map<String, Long> reviewPerformance = new LinkedHashMap<>();
        dateCursor = LocalDate.now().minusMonths(5);
        for (int i = 0; i < 6; i++) {
            reviewPerformance.put(dateCursor.format(formatter), 0L);
            dateCursor = dateCursor.plusMonths(1);
        }
        for (LoanReview r : allReviews) {
            if (r.getReviewDate() != null) {
                String monthKey = r.getReviewDate().format(formatter);
                if (reviewPerformance.containsKey(monthKey)) {
                    reviewPerformance.put(monthKey, reviewPerformance.get(monthKey) + 1);
                }
            }
        }

        // recentApplications (latest 5 non-draft applications)
        List<LoanApplicationResponse> recentApplications = allApps.stream()
                .filter(app -> app.getStatus() != LoanApplicationStatus.DRAFT)
                .sorted(Comparator.comparing(LoanApplication::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(applicationMapper::toResponse)
                .toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAssignedApplications", totalAssignedApplications);
        stats.put("awaitingReview", awaitingReview);
        stats.put("underReview", underReview);
        stats.put("overdueRepayments", overdueRepayments);
        stats.put("recommendedApprovals", recommendedApprovals);
        stats.put("recommendedRejections", recommendedRejections);
        stats.put("todayReviews", todayReviews);
        stats.put("statusDistribution", statusDistribution);
        stats.put("applicationsByMonth", applicationsByMonth);
        stats.put("reviewPerformance", reviewPerformance);
        stats.put("recentApplications", recentApplications);

        return stats;
    }

    @Override
    public Map<String, Object> getManagerStats() {
        List<LoanApplication> allApps = applicationRepository.findAll();
        long applicationsAwaitingDecision = allApps.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.UNDER_REVIEW)
                .count();

        long approvedApplications = allApps.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.APPROVED)
                .count();

        long rejectedApplications = allApps.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.REJECTED)
                .count();

        long totalApplications = allApps.stream()
                .filter(app -> app.getStatus() != LoanApplicationStatus.DRAFT)
                .count();

        // Status distribution for manager chart
        Map<String, Integer> statusDistribution = new HashMap<>();
        for (LoanApplicationStatus status : LoanApplicationStatus.values()) {
            statusDistribution.put(status.name(), 0);
        }
        for (LoanApplication app : allApps) {
            String statusName = app.getStatus().name();
            statusDistribution.put(statusName, statusDistribution.getOrDefault(statusName, 0) + 1);
        }

        // Performance Metrics: Approval Rate and Average Approval Time
        long totalReviewed = approvedApplications + rejectedApplications;
        double approvalRate = totalReviewed > 0 ? ((double) approvedApplications / totalReviewed) * 100.0 : 0.0;

        double totalDays = 0.0;
        long countWithReviewTime = 0;
        List<LoanApplication> reviewedApps = allApps.stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.APPROVED || app.getStatus() == LoanApplicationStatus.REJECTED)
                .toList();

        List<LoanReview> allReviews = reviewRepository.findAll();
        for (LoanApplication app : reviewedApps) {
            // Find reviews for this app
            List<LoanReview> reviews = allReviews.stream()
                    .filter(r -> r.getLoanApplication() != null && r.getLoanApplication().getId().equals(app.getId()))
                    .toList();
            // Find the latest review by a manager
            Optional<LoanReview> managerReview = reviews.stream()
                    .filter(r -> r.getReviewer() != null && r.getReviewer().getRole() == Role.MANAGER)
                    .max(Comparator.comparing(LoanReview::getReviewDate));
            if (managerReview.isPresent() && app.getCreatedAt() != null) {
                double days = java.time.Duration.between(app.getCreatedAt(), managerReview.get().getReviewDate()).toMinutes() / 1440.0;
                totalDays += days;
                countWithReviewTime++;
            }
        }
        double averageApprovalTime = countWithReviewTime > 0 ? (totalDays / countWithReviewTime) : 0.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("applicationsAwaitingDecision", applicationsAwaitingDecision);
        stats.put("approvedApplications", approvedApplications);
        stats.put("rejectedApplications", rejectedApplications);
        stats.put("totalApplications", totalApplications);
        stats.put("statusDistribution", statusDistribution);
        stats.put("approvalRate", approvalRate);
        stats.put("averageApprovalTime", averageApprovalTime);

        return stats;
    }

    @Override
    public Map<String, Object> getAdminStats() {
        long totalUsers = userRepository.count();
        long totalProducts = loanProductRepository.count();
        long totalApplications = applicationRepository.count();

        BigDecimal totalApprovedAmount = BigDecimal.ZERO;
        List<LoanApplication> approvedApps = applicationRepository.findAll().stream()
                .filter(app -> app.getStatus() == LoanApplicationStatus.APPROVED)
                .toList();

        for (LoanApplication app : approvedApps) {
            if (app.getRequestedAmount() != null) {
                totalApprovedAmount = totalApprovedAmount.add(app.getRequestedAmount());
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalProducts", totalProducts);
        stats.put("totalApplications", totalApplications);
        stats.put("totalApprovedAmount", totalApprovedAmount);

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBankStats() {
        List<BankTransaction> allTx = bankTransactionRepository.findAllByOrderByTransactionDateDesc();

        // ── Pull real account balances from the accounts table ────────────────
        List<Account> accounts = accountRepository.findAll();
        BigDecimal totalBankBalance = accounts.stream()
                .map(a -> a.getCurrentBalance() != null ? a.getCurrentBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> loanAccountBalances = new HashMap<>();
        for (LoanType type : LoanType.values()) {
            loanAccountBalances.put(type.name(), BigDecimal.ZERO);
        }
        for (Account account : accounts) {
            if (account.getLoanType() != null && account.getCurrentBalance() != null) {
                loanAccountBalances.put(account.getLoanType().name(), account.getCurrentBalance());
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        BigDecimal totalLoansDisbursed = allTx.stream()
                .filter(tx -> tx.getTransactionType() == com.loansystem.loan.domain.enums.TransactionType.LOAN_DISBURSEMENT)
                .map(BankTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLoanRepayments = allTx.stream()
                .filter(tx -> tx.getTransactionType() == com.loansystem.loan.domain.enums.TransactionType.LOAN_REPAYMENT)
                .map(BankTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOutstanding = repaymentScheduleRepository.findAll().stream()
                .filter(s -> s.getStatus() == RepaymentSchedule.PaymentStatus.PENDING || s.getStatus() == RepaymentSchedule.PaymentStatus.OVERDUE)
                .map(RepaymentSchedule::getTotalPayment)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long numberOfTransactions = bankTransactionRepository.count();

        List<BankTransactionResponse> recentTransactions = allTx.stream()
                .limit(10)
                .map(tx -> BankTransactionResponse.builder()
                        .id(tx.getId())
                        .transactionType(tx.getTransactionType().name())
                        .amount(tx.getAmount())
                        .balanceBefore(tx.getBalanceBefore())
                        .balanceAfter(tx.getBalanceAfter())
                        .description(tx.getDescription())
                        .transactionDate(tx.getTransactionDate())
                        .loanApplicationId(tx.getLoanApplication() != null ? tx.getLoanApplication().getId() : null)
                        .loanApplicationNumber(tx.getLoanApplication() != null ? tx.getLoanApplication().getApplicationNumber() : null)
                        .accountNumber(tx.getAccount() != null ? tx.getAccount().getAccountNumber() : null)
                        .accountName(tx.getAccount() != null ? tx.getAccount().getAccountName() : null)
                        .repaymentId(tx.getRepayment() != null ? tx.getRepayment().getId() : null)
                        .build())
                .toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBankBalance", totalBankBalance);
        stats.put("loanAccountBalances", loanAccountBalances);
        stats.put("totalLoansDisbursed", totalLoansDisbursed);
        stats.put("totalLoanRepayments", totalLoanRepayments);
        stats.put("totalOutstanding", totalOutstanding);
        stats.put("availableFunds", totalBankBalance);
        stats.put("numberOfTransactions", numberOfTransactions);
        stats.put("recentTransactions", recentTransactions);

        return stats;
    }
}
