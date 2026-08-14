package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.request.BankRequest;
import com.loansystem.loan.application.dto.response.BankResponse;
import java.util.List;

public interface BankService {
    BankResponse createBank(BankRequest request);
    BankResponse updateBank(Long id, BankRequest request);
    void deleteBank(Long id);
    BankResponse getBankById(Long id);
    List<BankResponse> getAllBanks();
}
