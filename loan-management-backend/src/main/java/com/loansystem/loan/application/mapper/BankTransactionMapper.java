package com.loansystem.loan.application.mapper;

import com.loansystem.loan.application.dto.response.BankTransactionResponse;
import com.loansystem.loan.domain.entity.BankTransaction;
import com.loansystem.loan.domain.enums.TransactionType;
import org.springframework.stereotype.Component;

@Component
public class BankTransactionMapper {

    public BankTransactionResponse toResponse(BankTransaction tx) {
        if (tx == null) return null;

        String ref = String.format("TXN-%06d", tx.getId());

        // Derive debit (source) and credit (destination) accounts
        String debitAccount  = null;
        String creditAccount = null;

        if (tx.getTransactionType() == TransactionType.LOAN_DISBURSEMENT) {
            // Bank pays customer
            debitAccount  = tx.getAccount() != null
                    ? tx.getAccount().getAccountName() + " (" + tx.getAccount().getAccountNumber() + ")"
                    : "Bank Loan Account";
            creditAccount = tx.getCustomer() != null
                    ? tx.getCustomer().getFullName() + " — Saving Account"
                    : "Customer Saving Account";
        } else if (tx.getTransactionType() == TransactionType.LOAN_REPAYMENT) {
            // Customer pays bank
            debitAccount  = tx.getCustomer() != null
                    ? tx.getCustomer().getFullName() + " — Repayment Account"
                    : "Customer Repayment Account";
            creditAccount = tx.getAccount() != null
                    ? tx.getAccount().getAccountName() + " (" + tx.getAccount().getAccountNumber() + ")"
                    : "Bank Loan Account";
        } else {
            debitAccount  = tx.getAccount() != null ? tx.getAccount().getAccountName() : "—";
            creditAccount = "—";
        }

        return BankTransactionResponse.builder()
                .id(tx.getId())
                .transactionRef(ref)
                .transactionType(tx.getTransactionType() != null ? tx.getTransactionType().name() : null)
                .amount(tx.getAmount())
                .balanceBefore(tx.getBalanceBefore())
                .balanceAfter(tx.getBalanceAfter())
                .status("COMPLETED")
                .description(tx.getDescription())
                .transactionDate(tx.getTransactionDate())
                .debitAccount(debitAccount)
                .creditAccount(creditAccount)

                .loanApplicationId(tx.getLoanApplication() != null ? tx.getLoanApplication().getId() : null)
                .loanApplicationNumber(tx.getLoanApplication() != null ? tx.getLoanApplication().getApplicationNumber() : null)
                .loanProductId(tx.getLoanProduct() != null ? tx.getLoanProduct().getId() : null)
                .loanProductName(tx.getLoanProduct() != null ? tx.getLoanProduct().getName() : null)
                .customerId(tx.getCustomer() != null ? tx.getCustomer().getId() : null)
                .customerName(tx.getCustomer() != null ? tx.getCustomer().getFullName() : null)
                .createdById(tx.getCreatedBy() != null ? tx.getCreatedBy().getId() : null)
                .createdByName(tx.getCreatedBy() != null ? tx.getCreatedBy().getFullName() : null)
                .repaymentId(tx.getRepayment() != null ? tx.getRepayment().getId() : null)
                .accountId(tx.getAccount() != null ? tx.getAccount().getId() : null)
                .accountNumber(tx.getAccount() != null ? tx.getAccount().getAccountNumber() : null)
                .accountName(tx.getAccount() != null ? tx.getAccount().getAccountName() : null)
                .build();
    }
}
