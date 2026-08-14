package com.loansystem.loan.application.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessResponse {

    private Long id;

    private String businessName;

    private String businessType;

    private String registrationNumber;

    private String tinNumber;

    private Integer yearsInOperation;

    private BigDecimal annualRevenue;
}