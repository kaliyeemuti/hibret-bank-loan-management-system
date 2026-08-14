package com.loansystem.loan.application.mapper;

import com.loansystem.loan.application.dto.request.BankRequest;
import com.loansystem.loan.application.dto.response.BankResponse;
import com.loansystem.loan.domain.entity.Bank;
import org.springframework.stereotype.Component;

@Component
public class BankMapper {

    public Bank toEntity(BankRequest request) {
        if (request == null) return null;
        return Bank.builder()
                .bankName(request.getBankName())
                .branchName(request.getBranchName())
                .address(request.getAddress())
                .status(request.getStatus())
                .build();
    }

    public BankResponse toResponse(Bank bank) {
        if (bank == null) return null;
        return BankResponse.builder()
                .id(bank.getId())
                .bankName(bank.getBankName())
                .branchName(bank.getBranchName())
                .address(bank.getAddress())
                .status(bank.getStatus())
                .createdAt(bank.getCreatedAt())
                .updatedAt(bank.getUpdatedAt())
                .build();
    }
}
