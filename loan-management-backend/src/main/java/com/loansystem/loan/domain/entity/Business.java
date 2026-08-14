package com.loansystem.loan.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "businesses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Business name is required")
    @Column(name = "business_name", nullable = false)
    private String businessName;

    @NotBlank(message = "Business type is required")
    @Column(name = "business_type", nullable = false)
    private String businessType;

    @Column(name = "registration_number", unique = true)
    private String registrationNumber;

    @Column(name = "tin_number", unique = true)
    private String tinNumber;

    @Column(name = "years_in_operation")
    private Integer yearsInOperation;

    @Column(name = "annual_revenue")
    private BigDecimal annualRevenue;

    @Column(nullable = false)
    private String address;

    private String phoneNumber;

    private String email;

    @OneToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private BusinessOwner owner;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}