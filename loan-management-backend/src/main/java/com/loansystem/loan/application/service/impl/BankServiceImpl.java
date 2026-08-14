package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.request.BankRequest;
import com.loansystem.loan.application.dto.response.BankResponse;
import com.loansystem.loan.application.mapper.BankMapper;
import com.loansystem.loan.application.service.BankService;
import com.loansystem.loan.domain.entity.Bank;
import com.loansystem.loan.domain.repository.BankRepository;
import com.loansystem.loan.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BankServiceImpl implements BankService {

    private final BankRepository bankRepository;
    private final BankMapper bankMapper;

    @Override
    public BankResponse createBank(BankRequest request) {
        Bank bank = bankMapper.toEntity(request);
        Bank saved = bankRepository.save(bank);
        return bankMapper.toResponse(saved);
    }

    @Override
    public BankResponse updateBank(Long id, BankRequest request) {
        Bank bank = bankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found with id: " + id));
        bank.setBankName(request.getBankName());
        bank.setBranchName(request.getBranchName());
        bank.setAddress(request.getAddress());
        if (request.getStatus() != null) {
            bank.setStatus(request.getStatus());
        }
        Bank saved = bankRepository.save(bank);
        return bankMapper.toResponse(saved);
    }

    @Override
    public void deleteBank(Long id) {
        if (!bankRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bank not found with id: " + id);
        }
        bankRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public BankResponse getBankById(Long id) {
        Bank bank = bankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found with id: " + id));
        return bankMapper.toResponse(bank);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankResponse> getAllBanks() {
        return bankRepository.findAll().stream()
                .map(bankMapper::toResponse)
                .collect(Collectors.toList());
    }
}
