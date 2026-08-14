package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.dto.response.CustomerAccountResponse;
import com.loansystem.loan.application.service.CustomerAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customer-accounts")
@RequiredArgsConstructor
public class CustomerAccountController {

    private final CustomerAccountService customerAccountService;

    @GetMapping("/my-accounts")
    public List<CustomerAccountResponse> getMyAccounts() {
        return customerAccountService.getMyAccounts();
    }
}
