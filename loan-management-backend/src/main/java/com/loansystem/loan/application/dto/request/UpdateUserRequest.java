package com.loansystem.loan.application.dto.request;

import com.loansystem.loan.domain.enums.EligibilityStatus;
import com.loansystem.loan.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    private String firstName;

    private String lastName;

    private String phoneNumber;

    private String email;

    private Role role;

    private EligibilityStatus eligibilityStatus;

    /** 13 numeric digits. Null = not changed. */
    @Pattern(regexp = "\\d{13}", message = "Account number must be exactly 13 digits")
    private String accountNumber;
}