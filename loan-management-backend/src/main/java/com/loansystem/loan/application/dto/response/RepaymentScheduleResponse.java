package com.loansystem.loan.application.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Safe DTO for repayment schedule installments.
 * Avoids exposing raw JPA entities with circular references over HTTP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepaymentScheduleResponse {

    private Long id;
    private Integer installmentNumber;
    private LocalDate dueDate;
    private BigDecimal principalAmount;
    private BigDecimal interestAmount;
    private BigDecimal totalPayment;
    private BigDecimal remainingBalance;
    private String status;
    private LocalDate paidDate;
    private Long loanApplicationId;
    private String loanApplicationNumber;
    private BigDecimal interestRate;  // annual interest rate from the loan product
}
