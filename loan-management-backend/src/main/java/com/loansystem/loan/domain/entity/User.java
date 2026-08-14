package com.loansystem.loan.domain.entity;

import com.loansystem.loan.domain.enums.Role;
import com.loansystem.loan.domain.enums.UserStatus;
import com.loansystem.loan.domain.enums.EligibilityStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @NotBlank(message = "Username is required")
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Email(message = "Invalid email address")
    @NotBlank(message = "Email is required")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "Phone number is required")
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "eligibility_status", nullable = false, length = 30)
    @Builder.Default
    private EligibilityStatus eligibilityStatus = EligibilityStatus.ELIGIBLE;

    /**
     * 13-digit customer account number. Nullable to allow existing rows that
     * predate this field; populated on registration or via profile update.
     * Unique is enforced at the DB level and in service validation.
     */
    @Column(name = "account_number", length = 13, unique = true)
    private String accountNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();

        if (status == null) {
            status = UserStatus.ACTIVE;
        }

        if (enabled == null) {
            enabled = true;
        }

        if (eligibilityStatus == null) {
            eligibilityStatus = EligibilityStatus.ELIGIBLE;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Transient
    public String getFullName() {
        return firstName + " " + lastName;
    }
}