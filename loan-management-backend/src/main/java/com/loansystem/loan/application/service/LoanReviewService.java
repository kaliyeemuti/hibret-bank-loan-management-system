package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.request.LoanReviewRequest;
import com.loansystem.loan.application.dto.response.LoanReviewResponse;

import java.util.List;

public interface LoanReviewService {


    LoanReviewResponse reviewLoan(
            LoanReviewRequest request);


    List<LoanReviewResponse> getAllReviews();

}