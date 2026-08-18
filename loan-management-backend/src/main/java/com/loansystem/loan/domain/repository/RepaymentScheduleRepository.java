package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.RepaymentSchedule;
import com.loansystem.loan.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, Long> {
    List<RepaymentSchedule> findByLoanApplicationId(Long loanApplicationId);

    /**
     * Returns all repayment schedules belonging to the given customer user,
     * navigating through the LoanApplication → Business → BusinessOwner → User chain.
     */
    @Query("SELECT rs FROM RepaymentSchedule rs " +
           "WHERE rs.loanApplication.business.owner.user = :user " +
           "ORDER BY rs.loanApplication.id, rs.installmentNumber")
    List<RepaymentSchedule> findByCustomerUser(@Param("user") User user);
}
