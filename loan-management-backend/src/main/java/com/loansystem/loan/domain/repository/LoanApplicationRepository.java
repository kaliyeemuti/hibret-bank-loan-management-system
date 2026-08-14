package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.Business;
import com.loansystem.loan.domain.entity.LoanApplication;
import com.loansystem.loan.domain.enums.LoanApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {

    List<LoanApplication> findByBusiness(Business business);

    List<LoanApplication> findByStatus(LoanApplicationStatus status);

    boolean existsByApplicationNumber(String applicationNumber);

    /**
     * Used to auto-reject all other active applications of a customer when
     * one of their applications is approved/disbursed.
     */
    List<LoanApplication> findByBusinessAndStatusIn(Business business, List<LoanApplicationStatus> statuses);
}