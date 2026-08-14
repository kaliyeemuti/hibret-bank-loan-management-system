package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.RepaymentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, Long> {
    List<RepaymentSchedule> findByLoanApplicationId(Long loanApplicationId);
}
