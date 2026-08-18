package com.loansystem.loan.domain.enums;

public enum TransactionType {
    LOAN_DISBURSEMENT,
    LOAN_REPAYMENT,
    ACCOUNT_ADJUSTMENT,
    /** Funds received into the customer's account (deposit or loan disbursement credit). */
    CUSTOMER_DEPOSIT,
    /** Funds withdrawn from the customer's account. */
    CUSTOMER_WITHDRAWAL
}
