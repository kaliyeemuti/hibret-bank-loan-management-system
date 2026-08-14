package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.response.AccountResponse;

import java.math.BigDecimal;
import java.util.List;

public interface AccountService {

    List<AccountResponse> getAllAccounts();

    AccountResponse getAccountById(Long id);

    AccountResponse updateBalance(Long id, BigDecimal newBalance, String remarks);
}
