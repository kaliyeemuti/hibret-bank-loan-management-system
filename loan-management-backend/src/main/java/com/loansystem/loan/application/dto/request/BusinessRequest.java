package com.loansystem.loan.application.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BusinessRequest {

    private String businessName;

    private String businessType;

    private String registrationNumber;

    private String tinNumber;

    private Integer yearsInOperation;

    private BigDecimal annualRevenue;

    private String address;

    private String phoneNumber;

    private String email;
}