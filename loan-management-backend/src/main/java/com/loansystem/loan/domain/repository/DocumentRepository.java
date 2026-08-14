package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.Document;
import com.loansystem.loan.domain.entity.LoanApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByLoanApplication(LoanApplication loanApplication);
}