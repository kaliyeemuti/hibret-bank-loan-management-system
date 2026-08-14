package com.loansystem.loan.application.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {
    private Long id;
    private String accountName;
    private String accountNumber;
    private String loanType;
    private BigDecimal currentBalance;
    private String currency;
    private String status;
    private Long bankId;
    private String bankName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
