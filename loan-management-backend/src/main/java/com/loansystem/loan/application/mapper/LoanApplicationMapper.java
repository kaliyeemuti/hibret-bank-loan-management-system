package com.loansystem.loan.application.mapper;

import com.loansystem.loan.application.dto.response.LoanApplicationResponse;
import com.loansystem.loan.domain.entity.LoanApplication;
import com.loansystem.loan.domain.entity.LoanReview;
import com.loansystem.loan.domain.repository.LoanReviewRepository;
import com.loansystem.loan.domain.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class LoanApplicationMapper {

    private final LoanReviewRepository reviewRepository;

    public LoanApplicationResponse toResponse(LoanApplication application) {
        if (application == null) {
            return null;
        }

        // Find reviews for this application to extract comments
        List<LoanReview> reviews = reviewRepository.findByLoanApplication(application);
        
        String officerRemarks = null;
        String managerRemarks = null;
        String reviewerName = null;

        if (reviews != null) {
            for (LoanReview review : reviews) {
                if (review.getReviewer() != null) {
                    if (review.getReviewer().getRole() == Role.LOAN_OFFICER) {
                        officerRemarks = review.getComments();
                        reviewerName = review.getReviewer().getFullName();
                    } else if (review.getReviewer().getRole() == Role.MANAGER) {
                        managerRemarks = review.getComments();
                    }
                }
            }
        }

        String persistedManagerRemarks = application.getManagerRemarks();
        String persistedRejectionReason = application.getRejectionReason();

        return LoanApplicationResponse.builder()
                .id(application.getId())
                .applicationNumber(application.getApplicationNumber())
                .requestedAmount(application.getRequestedAmount())
                .purpose(application.getPurpose())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .applicationDate(application.getApplicationDate())
                .customerName(application.getBusiness() != null && application.getBusiness().getOwner() != null ? 
                        application.getBusiness().getOwner().getFirstName() + " " + application.getBusiness().getOwner().getLastName() : "Customer")
                .loanProductName(application.getLoanProduct() != null ? application.getLoanProduct().getName() : "Loan")
                .loanProductId(application.getLoanProduct() != null ? application.getLoanProduct().getId() : null)
                .businessId(application.getBusiness() != null ? application.getBusiness().getId() : null)
                .reviewerName(reviewerName)
                .reviewComments(officerRemarks)
                .approvalComments(persistedManagerRemarks != null ? persistedManagerRemarks : managerRemarks)
                .managerRemarks(persistedManagerRemarks != null ? persistedManagerRemarks : managerRemarks)
                .rejectionReason(persistedRejectionReason)
                .decisionDate(application.getDecisionDate())
                .interestRate(application.getLoanProduct() != null ? application.getLoanProduct().getInterestRate() : null)
                .repaymentPeriodMonths(application.getLoanProduct() != null ? application.getLoanProduct().getRepaymentPeriodMonths() : null)
                .build();
    }
}