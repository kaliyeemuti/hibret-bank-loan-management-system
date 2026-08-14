package com.loansystem.loan.application.dto.response;

import com.loansystem.loan.domain.enums.Role;
import com.loansystem.loan.domain.enums.UserStatus;
import com.loansystem.loan.domain.enums.EligibilityStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;

    private String firstName;

    private String lastName;

    private String username;

    private String email;

    private String phoneNumber;

    private Role role;

    private UserStatus status;

    private EligibilityStatus eligibilityStatus;

    private String accountNumber;
}