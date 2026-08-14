package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.response.CustomerAccountResponse;
import com.loansystem.loan.domain.entity.CustomerAccount;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.CustomerAccountType;

import java.util.List;

public interface CustomerAccountService {
    List<CustomerAccountResponse> getMyAccounts();
    CustomerAccount getOrCreateAccount(User owner, CustomerAccountType type);
}
