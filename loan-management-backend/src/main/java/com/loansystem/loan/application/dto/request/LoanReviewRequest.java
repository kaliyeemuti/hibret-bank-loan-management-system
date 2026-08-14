package com.loansystem.loan.application.dto.request;

import com.loansystem.loan.domain.enums.ReviewDecision;
import lombok.Data;

@Data
public class LoanReviewRequest {

    private Long loanApplicationId;

    private ReviewDecision decision;

    private String comments;
}