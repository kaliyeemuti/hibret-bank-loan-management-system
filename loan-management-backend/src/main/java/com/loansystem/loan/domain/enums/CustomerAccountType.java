package com.loansystem.loan.domain.enums;

public enum CustomerAccountType {
    /**
     * The single unified customer account.
     * Replaces the old SAVING + REPAYMENT pair.
     *
     * - Credited on loan disbursement.
     * - Debited on loan repayment.
     * - Credited on customer deposit.
     * - Debited on customer withdrawal.
     */
    MY_ACCOUNT
}
