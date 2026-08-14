package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.response.CustomerAccountResponse;
import com.loansystem.loan.application.service.CustomerAccountService;
import com.loansystem.loan.domain.entity.CustomerAccount;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.CustomerAccountType;
import com.loansystem.loan.domain.repository.CustomerAccountRepository;
import com.loansystem.loan.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerAccountServiceImpl implements CustomerAccountService {

    private final CustomerAccountRepository customerAccountRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @Override
    @Transactional
    public List<CustomerAccountResponse> getMyAccounts() {
        User user = getAuthenticatedUser();
        // Ensure both SAVING and REPAYMENT accounts exist
        getOrCreateAccount(user, CustomerAccountType.SAVING);
        getOrCreateAccount(user, CustomerAccountType.REPAYMENT);

        return customerAccountRepository.findByOwner(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CustomerAccount getOrCreateAccount(User owner, CustomerAccountType type) {
        Optional<CustomerAccount> existing = customerAccountRepository.findByOwnerAndAccountType(owner, type);
        if (existing.isPresent()) {
            return existing.get();
        }

        CustomerAccount newAccount = new CustomerAccount();
        newAccount.setOwner(owner);
        newAccount.setAccountType(type);
        
        // Generate account number: phone number (or part of it) + suffix
        String base = owner.getPhoneNumber() != null ? owner.getPhoneNumber().replaceAll("[^0-9]", "") : String.valueOf(owner.getId());
        if (base.length() > 10) base = base.substring(base.length() - 10);
        String suffix = type == CustomerAccountType.SAVING ? "S" : "R";
        newAccount.setAccountNumber(base + "-" + suffix);
        
        return customerAccountRepository.save(newAccount);
    }

    private CustomerAccountResponse mapToResponse(CustomerAccount account) {
        return CustomerAccountResponse.builder()
                .id(account.getId())
                .ownerName(account.getOwner().getFullName())
                .accountType(account.getAccountType().name())
                .accountNumber(account.getAccountNumber())
                .currentBalance(account.getCurrentBalance())
                .currency(account.getCurrency())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
