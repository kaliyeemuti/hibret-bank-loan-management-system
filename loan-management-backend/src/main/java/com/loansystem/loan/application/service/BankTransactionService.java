package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.response.BankTransactionResponse;
import java.time.LocalDateTime;
import java.util.List;

public interface BankTransactionService {
    BankTransactionResponse getTransactionById(Long id);
    List<BankTransactionResponse> getAllTransactions();
    List<BankTransactionResponse> getTransactionsByLoan(Long loanId);
    List<BankTransactionResponse> getTransactionsByAccount(Long accountId);
    List<BankTransactionResponse> filterTransactionsByDate(LocalDateTime start, LocalDateTime end);
    List<BankTransactionResponse> filterTransactions(Long loanApplicationId, Long customerId, Long loanProductId, Long accountId, String transactionType, LocalDateTime start, LocalDateTime end);
    List<BankTransactionResponse> getMyTransactions();
    List<BankTransactionResponse> getMyFilteredTransactions(String transactionType, LocalDateTime start, LocalDateTime end);
}
