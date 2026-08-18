package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.dto.response.CustomerAccountResponse;
import com.loansystem.loan.application.service.CustomerAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer-accounts")
@RequiredArgsConstructor
public class CustomerAccountController {

    private final CustomerAccountService customerAccountService;

    /** Returns the authenticated customer's single My Account. */
    @GetMapping("/my-accounts")
    public List<CustomerAccountResponse> getMyAccounts() {
        return customerAccountService.getMyAccounts();
    }

    /**
     * Deposit funds into the authenticated customer's My Account.
     * Body: { "amount": 20000 }
     */
    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = parseBigDecimal(body.get("amount"));
            return ResponseEntity.ok(customerAccountService.depositToAccount(amount));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Deposit failed"));
        }
    }

    /**
     * Withdraw funds from the authenticated customer's My Account.
     * Body: { "amount": 5000 }
     */
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = parseBigDecimal(body.get("amount"));
            return ResponseEntity.ok(customerAccountService.withdrawFromAccount(amount));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Withdrawal failed"));
        }
    }

    // ── keep the old deposit URL as an alias so existing integrations don't break
    @PostMapping("/repayment/deposit")
    public ResponseEntity<?> depositLegacy(@RequestBody Map<String, Object> body) {
        return deposit(body);
    }

    private BigDecimal parseBigDecimal(Object val) {
        if (val == null) throw new IllegalArgumentException("Amount is required");
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        return new BigDecimal(val.toString());
    }
}
