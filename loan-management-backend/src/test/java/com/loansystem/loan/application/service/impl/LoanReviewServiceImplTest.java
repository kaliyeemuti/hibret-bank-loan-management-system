package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.request.LoanReviewRequest;
import com.loansystem.loan.application.mapper.LoanReviewMapper;
import com.loansystem.loan.domain.entity.LoanApplication;
import com.loansystem.loan.domain.entity.LoanProduct;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.LoanApplicationStatus;
import com.loansystem.loan.domain.enums.ReviewDecision;
import com.loansystem.loan.domain.enums.Role;
import com.loansystem.loan.domain.repository.*;
import com.loansystem.loan.application.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanReviewServiceImplTest {

    @Mock private LoanReviewRepository reviewRepository;
    @Mock private LoanApplicationRepository applicationRepository;
    // LoanReviewMapper is a concrete @Component — use @Spy so Byte Buddy does not
    // need to instrument it (avoids Java 26 / Byte Buddy 1.14 incompatibility).
    @Spy  private LoanReviewMapper reviewMapper;
    @Mock private LoanProductRepository loanProductRepository;
    @Mock private RepaymentScheduleRepository repaymentScheduleRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private BankTransactionRepository bankTransactionRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private com.loansystem.loan.application.service.CustomerAccountService customerAccountService;
    @Mock private CustomerAccountRepository customerAccountRepository;

    @InjectMocks
    private LoanReviewServiceImpl service;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("manager@example.com", null));
    }

    @Test
    void managerApprovalShouldPersistStatusRemarksAndDecisionDate() {
        User manager = new User();
        manager.setEmail("manager@example.com");
        manager.setRole(Role.MANAGER);

        LoanProduct product = new LoanProduct();
        product.setName("Personal Loan");
        product.setInterestRate(BigDecimal.valueOf(10));
        product.setRepaymentPeriodMonths(12);

        LoanApplication application = new LoanApplication();
        application.setId(101L);
        application.setStatus(LoanApplicationStatus.UNDER_REVIEW);
        application.setLoanProduct(product);
        application.setRequestedAmount(new BigDecimal("5000"));

        LoanReviewRequest request = new LoanReviewRequest();
        request.setLoanApplicationId(101L);
        request.setDecision(ReviewDecision.APPROVED);
        request.setComments("Approved after review");

        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(applicationRepository.findById(101L)).thenReturn(Optional.of(application));

        com.loansystem.loan.domain.entity.Account bankAccount = new com.loansystem.loan.domain.entity.Account();
        bankAccount.setCurrentBalance(new BigDecimal("100000"));
        when(accountRepository.findByLoanType(any())).thenReturn(Optional.of(bankAccount));

        service.reviewLoan(request);

        assertEquals(LoanApplicationStatus.DISBURSED, application.getStatus());
        assertEquals("Approved after review", application.getManagerRemarks());
        assertNotNull(application.getDecisionDate());
        verify(applicationRepository).save(application);
    }
}
