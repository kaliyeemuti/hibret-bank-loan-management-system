package com.loansystem.loan.application.dto.response;

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
public class CustomerAccountResponse {
    private Long id;
    private String ownerName;
    private String accountType;
    private String accountNumber;
    private BigDecimal currentBalance;
    private String currency;
    private String status;
    private LocalDateTime createdAt;
}
