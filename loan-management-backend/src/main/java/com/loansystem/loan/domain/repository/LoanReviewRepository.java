package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.LoanApplication;
import com.loansystem.loan.domain.entity.LoanReview;
import com.loansystem.loan.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanReviewRepository extends JpaRepository<LoanReview, Long> {

    List<LoanReview> findByLoanApplication(LoanApplication loanApplication);

    List<LoanReview> findByReviewer(User reviewer);

    /**
     * Returns the single review for a given application, if one already exists.
     * Used to decide whether to INSERT or UPDATE (upsert) a review record.
     */
    Optional<LoanReview> findFirstByLoanApplicationOrderByReviewDateDesc(LoanApplication loanApplication);
}
