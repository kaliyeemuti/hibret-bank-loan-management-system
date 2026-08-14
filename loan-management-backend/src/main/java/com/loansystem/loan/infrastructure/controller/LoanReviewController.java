package com.loansystem.loan.infrastructure.controller;


import com.loansystem.loan.application.dto.request.LoanReviewRequest;
import com.loansystem.loan.application.dto.response.LoanReviewResponse;
import com.loansystem.loan.application.service.LoanReviewService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class LoanReviewController {


    private final LoanReviewService reviewService;



    @PostMapping
    public LoanReviewResponse reviewLoan(
            @RequestBody LoanReviewRequest request){

        return reviewService.reviewLoan(request);
    }



    @GetMapping
    public List<LoanReviewResponse> getReviews(){

        return reviewService.getAllReviews();
    }

}