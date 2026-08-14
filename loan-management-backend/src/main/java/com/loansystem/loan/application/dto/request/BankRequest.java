package com.loansystem.loan.application.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankRequest {
    private String bankName;
    private String branchName;
    private String address;
    private String status;
}
