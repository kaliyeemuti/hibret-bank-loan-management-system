package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.dto.response.AccountResponse;
import com.loansystem.loan.application.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public List<AccountResponse> getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @GetMapping("/{id}")
    public AccountResponse getAccountById(@PathVariable Long id) {
        return accountService.getAccountById(id);
    }

    /**
     * Admin-only: manually set the current balance of a loan account.
     * Body: { "newBalance": 5000000.00, "remarks": "Top-up for Q3" }
     */
    @PutMapping("/{id}/balance")
    public ResponseEntity<?> updateBalance(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        // Security check: Only ADMIN can adjust account balances
        if (authentication == null || !authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only users with ADMIN role can adjust account balances"));
        }

        BigDecimal newBalance = new BigDecimal(body.get("newBalance").toString());
        String remarks = body.containsKey("remarks") ? body.get("remarks").toString() : null;
        return ResponseEntity.ok(accountService.updateBalance(id, newBalance, remarks));
    }
}
