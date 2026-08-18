package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.dto.request.RepaymentRequest;
import com.loansystem.loan.application.dto.response.RepaymentScheduleResponse;
import com.loansystem.loan.application.service.RepaymentScheduleService;
import com.loansystem.loan.domain.entity.RepaymentSchedule;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/repayment-schedules")
@RequiredArgsConstructor
public class RepaymentScheduleController {

    private final RepaymentScheduleService repaymentScheduleService;

    /**
     * Returns all repayment schedule installments for the authenticated customer.
     * Customer-scoped: only returns schedules belonging to the logged-in user's loans.
     */
    @GetMapping("/my-schedules")
    public List<RepaymentScheduleResponse> getMySchedules() {
        return repaymentScheduleService.getMySchedules();
    }

    /**
     * Returns repayment schedule for a specific loan application (admin/officer use).
     */
    @GetMapping("/loan-application/{loanApplicationId}")
    public List<RepaymentSchedule> getScheduleByLoanApplicationId(
            @PathVariable Long loanApplicationId) {
        return repaymentScheduleService.getScheduleByLoanApplicationId(loanApplicationId);
    }

    /**
     * Processes payment for a single installment.
     * Returns HTTP 400 with {"error": "..."} on any business rule violation.
     */
    @PostMapping("/{id}/pay")
    public ResponseEntity<?> payRepayment(
            @PathVariable Long id,
            @RequestBody RepaymentRequest request) {
        try {
            RepaymentSchedule result = repaymentScheduleService.payRepayment(
                    id, request.getAmount(), request.getPaymentMethod(), request.getRemarks());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Payment processing failed: " + e.getMessage()));
        }
    }
}
