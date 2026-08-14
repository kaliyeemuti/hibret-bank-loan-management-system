package com.loansystem.loan.application.dto.request;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepaymentRequest {
    private Long repaymentId;
    private BigDecimal amount;
    private String paymentMethod;
    private String remarks;
}
