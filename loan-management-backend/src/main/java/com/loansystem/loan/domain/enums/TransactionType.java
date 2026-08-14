package com.loansystem.loan.domain.enums;

public enum TransactionType {
    LOAN_DISBURSEMENT,
    LOAN_REPAYMENT,
    ACCOUNT_ADJUSTMENT,
    /** Funds received into the customer's saving account (e.g. loan proceeds). */
    CUSTOMER_DEPOSIT
}
