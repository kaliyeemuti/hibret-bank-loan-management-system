package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.dto.request.RepaymentRequest;
import com.loansystem.loan.application.service.RepaymentScheduleService;
import com.loansystem.loan.domain.entity.RepaymentSchedule;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/repayment-schedules")
@RequiredArgsConstructor
public class RepaymentScheduleController {

    private final RepaymentScheduleService repaymentScheduleService;

    @GetMapping("/loan-application/{loanApplicationId}")
    public List<RepaymentSchedule> getScheduleByLoanApplicationId(
            @PathVariable Long loanApplicationId) {
        return repaymentScheduleService.getScheduleByLoanApplicationId(loanApplicationId);
    }

    @PostMapping("/{id}/pay")
    public RepaymentSchedule payRepayment(
            @PathVariable Long id,
            @RequestBody RepaymentRequest request) {
        return repaymentScheduleService.payRepayment(id, request.getAmount(), request.getPaymentMethod(), request.getRemarks());
    }
}
