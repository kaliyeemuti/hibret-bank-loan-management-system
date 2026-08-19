package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.response.CustomerAccountResponse;
import com.loansystem.loan.domain.entity.Account;
import com.loansystem.loan.domain.entity.BankTransaction;
import com.loansystem.loan.domain.entity.CustomerAccount;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.CustomerAccountType;
import com.loansystem.loan.domain.enums.LoanType;
import com.loansystem.loan.domain.enums.TransactionType;
import com.loansystem.loan.domain.repository.AccountRepository;
import com.loansystem.loan.domain.repository.BankTransactionRepository;
import com.loansystem.loan.domain.repository.CustomerAccountRepository;
import com.loansystem.loan.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CustomerAccountServiceImplTest {

    @Mock private CustomerAccountRepository customerAccountRepository;
    @Mock private UserRepository             userRepository;
    @Mock private BankTransactionRepository  bankTransactionRepository;
    @Mock private AccountRepository          accountRepository;
    @Mock private SecurityContext            securityContext;
    @Mock private Authentication             authentication;

    @InjectMocks
    private CustomerAccountServiceImpl service;

    private User           customer;
    private CustomerAccount myAccount;
    private Account         systemAccount;

    @BeforeEach
    void setUp() {
        customer = new User();
        customer.setId(1L);
        customer.setEmail("customer@test.com");
        customer.setFirstName("Test");
        customer.setLastName("Customer");
        customer.setPhoneNumber("+1234567890");

        myAccount = new CustomerAccount();
        myAccount.setId(1L);
        myAccount.setOwner(customer);
        myAccount.setAccountType(CustomerAccountType.MY_ACCOUNT);
        myAccount.setAccountNumber("1234567890");
        myAccount.setCurrentBalance(BigDecimal.ZERO);
        myAccount.setCurrency("ETB");
        myAccount.setStatus("ACTIVE");

        systemAccount = new Account();
        systemAccount.setId(1L);
        systemAccount.setAccountName("Personal Loan Account");
        systemAccount.setAccountNumber("SYS001");
        systemAccount.setLoanType(LoanType.PERSONAL_LOAN);
        systemAccount.setCurrentBalance(BigDecimal.valueOf(15_000_000));
        systemAccount.setCurrency("ETB");
        systemAccount.setStatus("ACTIVE");

        when(authentication.getName()).thenReturn("customer@test.com");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(accountRepository.findAll()).thenReturn(List.of(systemAccount));
    }

    // ─── deposit tests ────────────────────────────────────────────────────────

    @Test
    void deposit_successfulDeposit() {
        BigDecimal amount   = BigDecimal.valueOf(20_000);
        BigDecimal expected = BigDecimal.valueOf(20_000);

        when(customerAccountRepository.findByOwnerWithLock(customer)).thenReturn(Optional.of(myAccount));
        when(customerAccountRepository.save(any())).thenReturn(myAccount);
        when(bankTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        CustomerAccountResponse result = service.depositToAccount(amount);

        assertNotNull(result);
        assertEquals(expected, result.getCurrentBalance());

        verify(customerAccountRepository).save(argThat(a ->
                a.getCurrentBalance().compareTo(expected) == 0));
        verify(bankTransactionRepository).save(argThat(t ->
                t.getTransactionType() == TransactionType.CUSTOMER_DEPOSIT &&
                t.getAmount().compareTo(amount) == 0 &&
                t.getBalanceBefore().compareTo(BigDecimal.ZERO) == 0 &&
                t.getBalanceAfter().compareTo(expected) == 0));
    }

    @Test
    void deposit_zeroAmount_throwsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.depositToAccount(BigDecimal.ZERO));
        assertEquals("Deposit amount must be greater than 0", ex.getMessage());
        verify(customerAccountRepository, never()).save(any());
        verify(bankTransactionRepository,   never()).save(any());
    }

    @Test
    void deposit_negativeAmount_throwsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.depositToAccount(BigDecimal.valueOf(-500)));
        assertEquals("Deposit amount must be greater than 0", ex.getMessage());
    }

    @Test
    void deposit_nullAmount_throwsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.depositToAccount(null));
        assertEquals("Deposit amount must be greater than 0", ex.getMessage());
    }

    @Test
    void deposit_existingBalance_increasesCorrectly() {
        myAccount.setCurrentBalance(BigDecimal.valueOf(5_000));
        BigDecimal deposit  = BigDecimal.valueOf(20_000);
        BigDecimal expected = BigDecimal.valueOf(25_000);

        when(customerAccountRepository.findByOwnerWithLock(customer)).thenReturn(Optional.of(myAccount));
        when(customerAccountRepository.save(any())).thenReturn(myAccount);
        when(bankTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        CustomerAccountResponse result = service.depositToAccount(deposit);

        assertEquals(expected, result.getCurrentBalance());
        verify(bankTransactionRepository).save(argThat(t ->
                t.getBalanceBefore().compareTo(BigDecimal.valueOf(5_000)) == 0 &&
                t.getBalanceAfter().compareTo(expected) == 0));
    }

    @Test
    void deposit_createsExactlyOneTransaction() {
        when(customerAccountRepository.findByOwnerWithLock(customer)).thenReturn(Optional.of(myAccount));
        when(customerAccountRepository.save(any())).thenReturn(myAccount);
        when(bankTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.depositToAccount(BigDecimal.valueOf(10_000));

        verify(bankTransactionRepository, times(1)).save(any());
    }

    @Test
    void deposit_userNotFound_throwsException() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.depositToAccount(BigDecimal.valueOf(10_000)));
        assertEquals("Authenticated user not found", ex.getMessage());
        verify(bankTransactionRepository, never()).save(any());
    }

    // ─── withdrawal tests ─────────────────────────────────────────────────────

    @Test
    void withdraw_successfulWithdrawal() {
        myAccount.setCurrentBalance(BigDecimal.valueOf(50_000));
        BigDecimal withdraw = BigDecimal.valueOf(20_000);
        BigDecimal expected = BigDecimal.valueOf(30_000);

        when(customerAccountRepository.findByOwnerWithLock(customer)).thenReturn(Optional.of(myAccount));
        when(customerAccountRepository.save(any())).thenReturn(myAccount);
        when(bankTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        CustomerAccountResponse result = service.withdrawFromAccount(withdraw);

        assertNotNull(result);
        assertEquals(expected, result.getCurrentBalance());
        verify(bankTransactionRepository).save(argThat(t ->
                t.getTransactionType() == TransactionType.CUSTOMER_WITHDRAWAL &&
                t.getAmount().compareTo(withdraw) == 0 &&
                t.getBalanceAfter().compareTo(expected) == 0));
    }

    @Test
    void withdraw_insufficientBalance_throwsException() {
        myAccount.setCurrentBalance(BigDecimal.valueOf(1_000));

        when(customerAccountRepository.findByOwnerWithLock(customer)).thenReturn(Optional.of(myAccount));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.withdrawFromAccount(BigDecimal.valueOf(5_000)));
        assertTrue(ex.getMessage().contains("Insufficient balance"));
        verify(customerAccountRepository, never()).save(any());
        verify(bankTransactionRepository,   never()).save(any());
    }

    @Test
    void withdraw_zeroAmount_throwsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.withdrawFromAccount(BigDecimal.ZERO));
        assertEquals("Withdrawal amount must be greater than 0", ex.getMessage());
    }

    @Test
    void withdraw_negativeAmount_throwsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.withdrawFromAccount(BigDecimal.valueOf(-100)));
        assertEquals("Withdrawal amount must be greater than 0", ex.getMessage());
    }

    @Test
    void withdraw_exactBalance_succeeds() {
        myAccount.setCurrentBalance(BigDecimal.valueOf(10_000));

        when(customerAccountRepository.findByOwnerWithLock(customer)).thenReturn(Optional.of(myAccount));
        when(customerAccountRepository.save(any())).thenReturn(myAccount);
        when(bankTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        CustomerAccountResponse result = service.withdrawFromAccount(BigDecimal.valueOf(10_000));
        assertEquals(BigDecimal.ZERO, result.getCurrentBalance());
    }

    @Test
    void withdraw_usesOptimisticLock() {
        myAccount.setCurrentBalance(BigDecimal.valueOf(10_000));

        when(customerAccountRepository.findByOwnerWithLock(customer)).thenReturn(Optional.of(myAccount));
        when(customerAccountRepository.save(any())).thenReturn(myAccount);
        when(bankTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.withdrawFromAccount(BigDecimal.valueOf(5_000));

        verify(customerAccountRepository).findByOwnerWithLock(customer);
    }
}
