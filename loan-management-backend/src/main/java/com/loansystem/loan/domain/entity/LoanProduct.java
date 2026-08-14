package com.loansystem.loan.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Loan product name is required")
    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 500)
    private String description;

    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "interest_rate", nullable = false)
    private BigDecimal interestRate;

    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "minimum_amount", nullable = false)
    private BigDecimal minimumAmount;

    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "maximum_amount", nullable = false)
    private BigDecimal maximumAmount;

    @Column(name = "repayment_period_months", nullable = false)
    private Integer repaymentPeriodMonths;

    @Column(name = "processing_fee")
    private BigDecimal processingFee;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();

        if (active == null) {
            active = true;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}