package com.loansystem.loan.application.mapper;

import com.loansystem.loan.application.dto.request.LoanReviewRequest;
import com.loansystem.loan.application.dto.response.LoanReviewResponse;
import com.loansystem.loan.domain.entity.LoanReview;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class LoanReviewMapper {

    public LoanReviewResponse toResponse(LoanReview review) {
        if (review == null) {
            return null;
        }

        return LoanReviewResponse.builder()
                .id(review.getId())
                .decision(review.getDecision() != null ? review.getDecision().name() : null)
                .comments(review.getComments())
                .reviewDate(review.getReviewDate() != null ? LocalDate.from(review.getReviewDate()) : LocalDate.now())
                .reviewerName(review.getReviewer() != null ? review.getReviewer().getFullName() : "Reviewer")
                .reviewStage(review.getReviewer() != null ? (review.getReviewer().getRole() == com.loansystem.loan.domain.enums.Role.LOAN_OFFICER ? "LOAN OFFICER" : "MANAGER") : "REVIEW")
                .build();
    }
}