package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.response.AccountResponse;
import com.loansystem.loan.application.service.AccountService;
import com.loansystem.loan.domain.entity.Account;
import com.loansystem.loan.domain.entity.BankTransaction;
import com.loansystem.loan.domain.enums.TransactionType;
import com.loansystem.loan.domain.repository.AccountRepository;
import com.loansystem.loan.domain.repository.BankTransactionRepository;
import com.loansystem.loan.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final BankTransactionRepository bankTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
        return toResponse(account);
    }

    @Override
    public AccountResponse updateBalance(Long id, BigDecimal newBalance, String remarks) {
        if (newBalance == null || newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Balance must be zero or positive");
        }

        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));

        BigDecimal balanceBefore = account.getCurrentBalance();
        account.setCurrentBalance(newBalance);
        accountRepository.save(account);

        // Record the manual adjustment as a transaction for audit purposes
        BankTransaction adjustment = BankTransaction.builder()
                .transactionType(TransactionType.ACCOUNT_ADJUSTMENT)
                .amount(newBalance.subtract(balanceBefore).abs())
                .balanceBefore(balanceBefore)
                .balanceAfter(newBalance)
                .description("Manual balance adjustment for account " + account.getAccountNumber()
                        + (remarks != null && !remarks.isBlank() ? ". Remarks: " + remarks : ""))
                .transactionDate(LocalDateTime.now())
                .account(account)
                .build();
        bankTransactionRepository.save(adjustment);

        return toResponse(account);
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountName(account.getAccountName())
                .accountNumber(account.getAccountNumber())
                .loanType(account.getLoanType() != null ? account.getLoanType().name() : null)
                .currentBalance(account.getCurrentBalance())
                .currency(account.getCurrency())
                .status(account.getStatus())
                .bankId(account.getBank() != null ? account.getBank().getId() : null)
                .bankName(account.getBank() != null ? account.getBank().getBankName() : null)
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
