package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.dto.response.BankTransactionResponse;
import com.loansystem.loan.application.service.BankTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class BankTransactionController {

    private final BankTransactionService transactionService;

    // ── Customer endpoints ───────────────────────────────────────────────────

    /**
     * Returns ALL transactions belonging to the authenticated customer.
     * Ownership is enforced at the service layer via JWT — no customer ID from the client.
     */
    @GetMapping("/my-history")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<BankTransactionResponse> getMyTransactions() {
        return transactionService.getMyTransactions();
    }

    /**
     * Customer can filter their own transactions by type and date range.
     */
    @GetMapping("/my-history/filter")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<BankTransactionResponse> getMyFilteredTransactions(
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return transactionService.getMyFilteredTransactions(transactionType, start, end);
    }

    // ── Staff endpoints (Admin / Manager / Loan Officer) ─────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','LOAN_OFFICER')")
    public List<BankTransactionResponse> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','LOAN_OFFICER')")
    public BankTransactionResponse getTransactionById(@PathVariable Long id) {
        return transactionService.getTransactionById(id);
    }

    @GetMapping("/loan/{loanId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','LOAN_OFFICER')")
    public List<BankTransactionResponse> getTransactionsByLoan(@PathVariable Long loanId) {
        return transactionService.getTransactionsByLoan(loanId);
    }

    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','LOAN_OFFICER')")
    public List<BankTransactionResponse> getTransactionsByAccount(@PathVariable Long accountId) {
        return transactionService.getTransactionsByAccount(accountId);
    }

    /**
     * Advanced filter for staff — all params optional.
     * Supports filtering by customer, account, type, loan, date range.
     */
    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','LOAN_OFFICER')")
    public List<BankTransactionResponse> filterTransactions(
            @RequestParam(required = false) Long loanId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long loanProductId,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return transactionService.filterTransactions(loanId, customerId, loanProductId, accountId, transactionType, start, end);
    }
}
