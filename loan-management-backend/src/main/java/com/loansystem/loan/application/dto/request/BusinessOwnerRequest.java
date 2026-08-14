package com.loansystem.loan.application.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BusinessOwnerRequest {

    private String firstName;

    private String lastName;

    private String gender;

    private LocalDate dateOfBirth;

    private String nationalId;

    private String phoneNumber;

    private String email;

    private String address;

    private String occupation;

    private BigDecimal monthlyIncome;
}