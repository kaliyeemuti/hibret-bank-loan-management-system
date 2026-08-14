package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.response.BankTransactionResponse;
import com.loansystem.loan.application.mapper.BankTransactionMapper;
import com.loansystem.loan.application.service.BankTransactionService;
import com.loansystem.loan.domain.entity.BankTransaction;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.repository.BankTransactionRepository;
import com.loansystem.loan.domain.repository.UserRepository;
import com.loansystem.loan.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BankTransactionServiceImpl implements BankTransactionService {

    private final BankTransactionRepository transactionRepository;
    private final BankTransactionMapper transactionMapper;
    private final UserRepository userRepository;

    // ── Resolve authenticated user from JWT ───────────────────────────────
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @Override
    public BankTransactionResponse getTransactionById(Long id) {
        BankTransaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        return transactionMapper.toResponse(tx);
    }

    @Override
    public List<BankTransactionResponse> getAllTransactions() {
        return transactionRepository.findAllByOrderByTransactionDateDesc().stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BankTransactionResponse> getTransactionsByLoan(Long loanId) {
        return transactionRepository.findByLoanApplicationId(loanId).stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BankTransactionResponse> getTransactionsByAccount(Long accountId) {
        return List.of();
    }

    @Override
    public List<BankTransactionResponse> filterTransactionsByDate(LocalDateTime start, LocalDateTime end) {
        return transactionRepository.findByTransactionDateBetween(start, end).stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BankTransactionResponse> filterTransactions(
            Long loanApplicationId, Long customerId, Long loanProductId,
            Long accountId, String transactionType, LocalDateTime start, LocalDateTime end) {
        return transactionRepository.findAllByOrderByTransactionDateDesc().stream()
                .filter(tx -> loanApplicationId == null || (tx.getLoanApplication() != null && loanApplicationId.equals(tx.getLoanApplication().getId())))
                .filter(tx -> customerId == null || (tx.getCustomer() != null && customerId.equals(tx.getCustomer().getId())))
                .filter(tx -> loanProductId == null || (tx.getLoanProduct() != null && loanProductId.equals(tx.getLoanProduct().getId())))
                .filter(tx -> accountId == null || (tx.getAccount() != null && accountId.equals(tx.getAccount().getId())))
                .filter(tx -> transactionType == null || transactionType.isBlank() || tx.getTransactionType() != null && tx.getTransactionType().name().equalsIgnoreCase(transactionType))
                .filter(tx -> start == null || tx.getTransactionDate() != null && !tx.getTransactionDate().isBefore(start))
                .filter(tx -> end == null || tx.getTransactionDate() != null && !tx.getTransactionDate().isAfter(end))
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns ONLY the transactions belonging to the currently authenticated customer.
     * The customer is derived entirely from the JWT — no client-supplied ID is accepted.
     */
    @Override
    public List<BankTransactionResponse> getMyTransactions() {
        User user = getAuthenticatedUser();
        return transactionRepository.findByCustomerOrderByTransactionDateDesc(user).stream()
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Customer-filtered version — still enforces ownership via JWT.
     */
    @Override
    public List<BankTransactionResponse> getMyFilteredTransactions(String transactionType, LocalDateTime start, LocalDateTime end) {
        User user = getAuthenticatedUser();
        return transactionRepository.findByCustomerOrderByTransactionDateDesc(user).stream()
                .filter(tx -> transactionType == null || transactionType.isBlank()
                        || (tx.getTransactionType() != null && tx.getTransactionType().name().equalsIgnoreCase(transactionType)))
                .filter(tx -> start == null || tx.getTransactionDate() != null && !tx.getTransactionDate().isBefore(start))
                .filter(tx -> end == null || tx.getTransactionDate() != null && !tx.getTransactionDate().isAfter(end))
                .map(transactionMapper::toResponse)
                .collect(Collectors.toList());
    }
}
