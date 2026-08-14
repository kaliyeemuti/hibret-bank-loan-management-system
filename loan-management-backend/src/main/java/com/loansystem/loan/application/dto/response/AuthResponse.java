package com.loansystem.loan.application.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;

    private String message;

    private String email;

    private String role;

    private String username;

    private String fullName;

    private Long id;
}