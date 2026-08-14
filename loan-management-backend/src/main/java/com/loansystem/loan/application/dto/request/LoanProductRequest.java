package com.loansystem.loan.application.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanProductRequest {

    private String name;

    private String description;

    private BigDecimal interestRate;

    private BigDecimal minimumAmount;

    private BigDecimal maximumAmount;

    private Integer repaymentPeriodMonths;

    private BigDecimal processingFee;
}