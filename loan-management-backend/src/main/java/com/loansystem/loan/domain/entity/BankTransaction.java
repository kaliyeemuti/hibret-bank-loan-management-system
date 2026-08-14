package com.loansystem.loan.domain.entity;

import com.loansystem.loan.domain.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;


    @Column(
        name = "amount",
        nullable = false,
        precision = 19,
        scale = 2
    )
    private BigDecimal amount;


    @Column(
        name = "balance_before",
        nullable = false,
        precision = 19,
        scale = 2
    )
    private BigDecimal balanceBefore;


    @Column(
        name = "balance_after",
        nullable = false,
        precision = 19,
        scale = 2
    )
    private BigDecimal balanceAfter;


    @Column(name = "description", length = 500)
    private String description;


    @Column(name = "transaction_date", nullable = false)
    @Builder.Default
    private LocalDateTime transactionDate = LocalDateTime.now();

    // Loan account that funded / received this transaction
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;




    // Related loan application
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id")
    private LoanApplication loanApplication;



    // Related loan product
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_product_id")
    private LoanProduct loanProduct;



    // Customer who owns the loan
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;



    // User who created the transaction (manager/officer)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;



    // Used when transaction is repayment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repayment_schedule_id")
    private RepaymentSchedule repayment;


}
