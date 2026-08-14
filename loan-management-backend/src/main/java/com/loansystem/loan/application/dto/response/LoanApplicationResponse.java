package com.loansystem.loan.application.dto.response;

import com.loansystem.loan.domain.enums.LoanApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanApplicationResponse {

    private Long id;

    private String applicationNumber;

    private BigDecimal requestedAmount;

    private String purpose;

    private LoanApplicationStatus status;

    private LocalDateTime createdAt;

    private String customerName;

    private String loanProductName;

    private Long loanProductId;

    private Long businessId;

    private java.time.LocalDate applicationDate;

    private String reviewerName;

    private String reviewComments;

    private String approvalComments;

    private String managerRemarks;

    private String rejectionReason;

    private LocalDateTime decisionDate;

    private BigDecimal interestRate;

    private Integer repaymentPeriodMonths;
}