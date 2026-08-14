package com.loansystem.loan.application.dto.request;

import com.loansystem.loan.domain.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    private String password;

    private Role role;

    /**
     * Must be exactly 13 numeric digits. Required for customer self-registration.
     */
    @NotBlank(message = "Account number is required")
    @Pattern(regexp = "\\d{13}", message = "Account number must be exactly 13 digits")
    private String accountNumber;
}