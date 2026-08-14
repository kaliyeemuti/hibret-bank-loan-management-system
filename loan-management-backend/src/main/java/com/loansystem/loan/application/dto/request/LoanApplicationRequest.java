package com.loansystem.loan.application.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanApplicationRequest {

    private Long businessId;

    private Long loanProductId;

    private BigDecimal requestedAmount;

    private String purpose;
}