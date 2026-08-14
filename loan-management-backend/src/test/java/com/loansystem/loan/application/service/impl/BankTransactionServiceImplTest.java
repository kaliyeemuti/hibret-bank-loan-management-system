package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.response.BankTransactionResponse;
import com.loansystem.loan.application.mapper.BankTransactionMapper;
import com.loansystem.loan.domain.entity.BankTransaction;
import com.loansystem.loan.domain.entity.LoanApplication;
import com.loansystem.loan.domain.entity.LoanProduct;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.TransactionType;
import com.loansystem.loan.domain.repository.BankTransactionRepository;
import com.loansystem.loan.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BankTransactionServiceImplTest {

    @Mock
    private BankTransactionRepository transactionRepository;

    // BankTransactionMapper is a concrete @Component with no required constructor args.
    // Use @Spy so Byte Buddy doesn't need to instrument it on Java 26.
    @Spy
    private BankTransactionMapper transactionMapper;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BankTransactionServiceImpl transactionService;

    @Test
    void filterTransactions_shouldFilterByLoanProductTypeAndDate() {
        LoanApplication application = new LoanApplication();
        application.setId(20L);
        application.setApplicationNumber("APP-20");

        LoanProduct product = new LoanProduct();
        product.setId(30L);
        product.setName("Personal Loan");

        User customer = new User();
        customer.setId(40L);
        customer.setFirstName("Jane");
        customer.setLastName("Doe");

        BankTransaction tx = BankTransaction.builder()
                .id(1L)
                .transactionType(TransactionType.LOAN_DISBURSEMENT)
                .amount(BigDecimal.valueOf(4000))
                .balanceBefore(BigDecimal.valueOf(10000))
                .balanceAfter(BigDecimal.valueOf(6000))
                .description("Disbursement")
                .transactionDate(LocalDateTime.of(2026, 8, 1, 10, 0))
                .loanApplication(application)
                .build();
        tx.setLoanProduct(product);
        tx.setCustomer(customer);

        when(transactionRepository.findAllByOrderByTransactionDateDesc()).thenReturn(List.of(tx));

        // Use the real mapper — it doesn't need any stubbing since it maps from the real entity
        List<BankTransactionResponse> result = transactionService.filterTransactions(
                20L, 40L, 30L, null, "LOAN_DISBURSEMENT",
                LocalDateTime.of(2026, 7, 31, 0, 0),
                LocalDateTime.of(2026, 8, 2, 23, 59));

        assertEquals(1, result.size());
        assertEquals("LOAN_DISBURSEMENT", result.get(0).getTransactionType());
    }
}
