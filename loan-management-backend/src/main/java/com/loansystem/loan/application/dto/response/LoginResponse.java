package com.loansystem.loan.application.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String message;
    private UserResponse user;
}