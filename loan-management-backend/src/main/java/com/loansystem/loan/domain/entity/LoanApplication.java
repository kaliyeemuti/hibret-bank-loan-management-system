package com.loansystem.loan.domain.entity;

import com.loansystem.loan.domain.enums.LoanApplicationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_number", nullable = false, unique = true)
    private String applicationNumber;

    @ManyToOne
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne
    @JoinColumn(name = "loan_product_id", nullable = false)
    private LoanProduct loanProduct;

    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "requested_amount", nullable = false)
    private BigDecimal requestedAmount;

    @Column(length = 1000)
    private String purpose;

    @NotNull
    @Column(name = "application_date")
    private LocalDate applicationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false,
            columnDefinition = "ENUM('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','DISBURSED','COMPLETED')")
    private LoanApplicationStatus status;



    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "manager_remarks", length = 2000)
    private String managerRemarks;

    @Column(name = "rejection_reason", length = 2000)
    private String rejectionReason;

    @Column(name = "decision_date")
    private LocalDateTime decisionDate;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();

        if (applicationNumber == null) {
            applicationNumber = "APP-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        if (applicationDate == null) {
            applicationDate = LocalDate.now();
        }

        if (status == null) {
            status = LoanApplicationStatus.DRAFT;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}