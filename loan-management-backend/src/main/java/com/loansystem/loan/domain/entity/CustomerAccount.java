package com.loansystem.loan.domain.entity;

import com.loansystem.loan.domain.enums.CustomerAccountType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Personal account belonging to a customer.
 * Each customer has TWO rows — one SAVING and one REPAYMENT account.
 *
 * SAVING    — credited when a loan is disbursed.
 * REPAYMENT — debited when the customer makes a monthly repayment.
 *
 * Balance updates are always performed inside a @Transactional service method
 * so either both sides of a transfer succeed or both roll back.
 */
@Entity
@Table(
    name = "customer_accounts",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_customer_account_type",
        columnNames = {"user_id", "account_type"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20)
    private CustomerAccountType accountType;

    /** Derived account number: user.accountNumber + suffix ("S" or "R"). */
    @Column(name = "account_number", nullable = false, unique = true, length = 16)
    private String accountNumber;

    @Column(name = "current_balance", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "ETB";

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (currentBalance == null) currentBalance = BigDecimal.ZERO;
        if (currency     == null) currency     = "ETB";
        if (status       == null) status       = "ACTIVE";
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
