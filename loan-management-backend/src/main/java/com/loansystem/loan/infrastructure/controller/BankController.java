package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.dto.request.BankRequest;
import com.loansystem.loan.application.dto.response.BankResponse;
import com.loansystem.loan.application.service.BankService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/banks")
@RequiredArgsConstructor
public class BankController {

    private final BankService bankService;

    @PostMapping
    public BankResponse createBank(@RequestBody BankRequest request) {
        return bankService.createBank(request);
    }

    @PutMapping("/{id}")
    public BankResponse updateBank(@PathVariable Long id, @RequestBody BankRequest request) {
        return bankService.updateBank(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteBank(@PathVariable Long id) {
        bankService.deleteBank(id);
    }

    @GetMapping("/{id}")
    public BankResponse getBankById(@PathVariable Long id) {
        return bankService.getBankById(id);
    }

    @GetMapping
    public List<BankResponse> getAllBanks() {
        return bankService.getAllBanks();
    }
}
