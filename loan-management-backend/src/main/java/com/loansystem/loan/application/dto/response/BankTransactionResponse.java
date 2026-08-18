package com.loansystem.loan.application.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransactionResponse {
    private Long id;
    /** Human-readable reference, e.g. TXN-000042 */
    private String transactionRef;
    private String transactionType;
    private BigDecimal amount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    /** Always "COMPLETED" for persisted transactions (can be extended for pending/failed) */
    private String status;
    private String description;
    private LocalDateTime transactionDate;

    /** Source (debited) side — bank account name or customer account number */
    private String debitAccount;
    /** Destination (credited) side — bank account name or customer account number */
    private String creditAccount;

    private Long loanApplicationId;
    private String loanApplicationNumber;
    private Long loanProductId;
    private String loanProductName;
    private Long customerId;
    private String customerName;
    private Long createdById;
    private String createdByName;
    private Long repaymentId;

    // Bank-side loan account
    private Long accountId;
    private String accountNumber;
    private String accountName;

    /** Interest rate from the related loan product (if applicable) */
    private BigDecimal interestRate;
}
