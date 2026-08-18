package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.response.RepaymentScheduleResponse;
import com.loansystem.loan.domain.entity.RepaymentSchedule;

import java.math.BigDecimal;
import java.util.List;

public interface RepaymentScheduleService {
    List<RepaymentSchedule> getScheduleByLoanApplicationId(Long loanApplicationId);

    /** Returns all repayment schedule installments for the authenticated customer. */
    List<RepaymentScheduleResponse> getMySchedules();

    RepaymentSchedule payRepayment(Long repaymentId, BigDecimal amount, String paymentMethod, String remarks);
}

