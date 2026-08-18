package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.response.CustomerAccountResponse;
import com.loansystem.loan.application.service.CustomerAccountService;
import com.loansystem.loan.domain.entity.BankTransaction;
import com.loansystem.loan.domain.entity.CustomerAccount;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.CustomerAccountType;
import com.loansystem.loan.domain.enums.TransactionType;
import com.loansystem.loan.domain.repository.BankTransactionRepository;
import com.loansystem.loan.domain.repository.CustomerAccountRepository;
import com.loansystem.loan.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerAccountServiceImpl implements CustomerAccountService {

    private final CustomerAccountRepository customerAccountRepository;
    private final UserRepository             userRepository;
    private final BankTransactionRepository  bankTransactionRepository;

    // ── Auth ─────────────────────────────────────────────────────────────────
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    // ── getMyAccounts ─────────────────────────────────────────────────────────
    @Override
    @Transactional
    public List<CustomerAccountResponse> getMyAccounts() {
        User user = getAuthenticatedUser();
        CustomerAccount account = getOrCreateAccount(user);
        return List.of(mapToResponse(account));
    }

    // ── getOrCreateAccount ────────────────────────────────────────────────────
    @Override
    @Transactional
    public CustomerAccount getOrCreateAccount(User owner) {
        return customerAccountRepository.findByOwner(owner).orElseGet(() -> {
            // Generate account number from phone (digits only, last 10)
            String base = owner.getPhoneNumber() != null
                    ? owner.getPhoneNumber().replaceAll("[^0-9]", "")
                    : String.valueOf(owner.getId());
            if (base.length() > 10) base = base.substring(base.length() - 10);

            CustomerAccount acc = new CustomerAccount();
            acc.setOwner(owner);
            acc.setAccountType(CustomerAccountType.MY_ACCOUNT);
            acc.setAccountNumber(base);
            acc.setCurrentBalance(BigDecimal.ZERO);
            acc.setCurrency("ETB");
            acc.setStatus("ACTIVE");
            return customerAccountRepository.save(acc);
        });
    }

    // ── depositToAccount ──────────────────────────────────────────────────────
    @Override
    @Transactional
    public CustomerAccountResponse depositToAccount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be greater than 0");
        }

        User customer = getAuthenticatedUser();
        CustomerAccount account = customerAccountRepository.findByOwnerWithLock(customer)
                .orElseGet(() -> getOrCreateAccount(customer));

        if (!account.getOwner().getId().equals(customer.getId())) {
            throw new SecurityException("Account does not belong to authenticated customer");
        }

        BigDecimal before = account.getCurrentBalance();
        BigDecimal after  = before.add(amount);
        account.setCurrentBalance(after);
        customerAccountRepository.save(account);

        bankTransactionRepository.save(BankTransaction.builder()
                .transactionType(TransactionType.CUSTOMER_DEPOSIT)
                .amount(amount)
                .balanceBefore(before)
                .balanceAfter(after)
                .description("Cash deposit to My Account")
                .transactionDate(LocalDateTime.now())
                .customer(customer)
                .createdBy(customer)
                .build());

        return mapToResponse(account);
    }

    // ── withdrawFromAccount ───────────────────────────────────────────────────
    @Override
    @Transactional
    public CustomerAccountResponse withdrawFromAccount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than 0");
        }

        User customer = getAuthenticatedUser();
        CustomerAccount account = customerAccountRepository.findByOwnerWithLock(customer)
                .orElseThrow(() -> new IllegalStateException("My Account not found"));

        if (!account.getOwner().getId().equals(customer.getId())) {
            throw new SecurityException("Account does not belong to authenticated customer");
        }

        BigDecimal before = account.getCurrentBalance();
        if (before.compareTo(amount) < 0) {
            throw new IllegalArgumentException(String.format(
                    "Insufficient balance. Available: %.2f ETB, Requested: %.2f ETB.",
                    before, amount));
        }

        BigDecimal after = before.subtract(amount);
        account.setCurrentBalance(after);
        customerAccountRepository.save(account);

        bankTransactionRepository.save(BankTransaction.builder()
                .transactionType(TransactionType.CUSTOMER_WITHDRAWAL)
                .amount(amount)
                .balanceBefore(before)
                .balanceAfter(after)
                .description("Withdrawal from My Account")
                .transactionDate(LocalDateTime.now())
                .customer(customer)
                .createdBy(customer)
                .build());

        return mapToResponse(account);
    }

    // ── mapper ────────────────────────────────────────────────────────────────
    private CustomerAccountResponse mapToResponse(CustomerAccount account) {
        return CustomerAccountResponse.builder()
                .id(account.getId())
                .ownerName(account.getOwner().getFullName())
                .accountType(account.getAccountType().name())
                .accountNumber(account.getAccountNumber())
                .currentBalance(account.getCurrentBalance())
                .currency(account.getCurrency())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
