package com.loansystem.loan.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder; // 1. Import the Builder annotation
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder // 2. Add Builder here
@NoArgsConstructor // Required by JPA when @Builder is used
@AllArgsConstructor // Required by Lombok's @Builder
@Entity
@Table(name = "business_owners")
public class BusinessOwner {
    // ... rest of your code

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String firstName;
    private String lastName;
    private String gender;
    private String nationalId;
    private String phoneNumber;
    private String email;
    private LocalDate dateOfBirth;
    private String address;
    private String occupation;
    private BigDecimal monthlyIncome;

    // 3. REMOVE the manual public static Object builder() method entirely!
}