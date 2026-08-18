package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.response.CustomerAccountResponse;
import com.loansystem.loan.domain.entity.CustomerAccount;
import com.loansystem.loan.domain.entity.User;

import java.math.BigDecimal;
import java.util.List;

public interface CustomerAccountService {

    /** Returns the authenticated customer's single My Account. */
    List<CustomerAccountResponse> getMyAccounts();

    /**
     * Returns (or creates) the single MY_ACCOUNT for the given user.
     * Safe to call multiple times — idempotent.
     */
    CustomerAccount getOrCreateAccount(User owner);

    /**
     * Simulated cash deposit into the customer's My Account.
     * @param amount must be > 0
     */
    CustomerAccountResponse depositToAccount(BigDecimal amount);

    /**
     * Simulated withdrawal from the customer's My Account.
     * @param amount must be > 0 and <= current balance
     */
    CustomerAccountResponse withdrawFromAccount(BigDecimal amount);
}
