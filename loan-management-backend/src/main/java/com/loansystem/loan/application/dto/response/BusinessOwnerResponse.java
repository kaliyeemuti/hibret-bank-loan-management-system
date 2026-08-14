package com.loansystem.loan.application.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessOwnerResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String gender;
    private String nationalId;
    private String phoneNumber;
    private String email;
}