package com.loansystem.loan.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanProductResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal interestRate;
    private BigDecimal minimumAmount;
    private BigDecimal maximumAmount;
    private Integer repaymentPeriodMonths;
    private BigDecimal processingFee;
}