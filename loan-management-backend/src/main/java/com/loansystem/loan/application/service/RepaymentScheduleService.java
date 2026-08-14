package com.loansystem.loan.application.service;

import com.loansystem.loan.domain.entity.RepaymentSchedule;

import java.math.BigDecimal;
import java.util.List;

public interface RepaymentScheduleService {
    List<RepaymentSchedule> getScheduleByLoanApplicationId(Long loanApplicationId);
    
    RepaymentSchedule payRepayment(Long repaymentId, BigDecimal amount, String paymentMethod, String remarks);
}
