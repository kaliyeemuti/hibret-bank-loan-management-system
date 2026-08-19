package com.loansystem.loan.infrastructure.controller;


import com.loansystem.loan.application.dto.request.LoanApplicationRequest;
import com.loansystem.loan.application.dto.response.LoanApplicationResponse;
import com.loansystem.loan.application.service.LoanApplicationService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/api/loan-applications")
@RequiredArgsConstructor
public class LoanApplicationController {


    private final LoanApplicationService applicationService;



    @PostMapping
    public LoanApplicationResponse applyLoan(
            @RequestBody LoanApplicationRequest request){

        return applicationService.applyLoan(request);
    }



    @GetMapping
    public List<LoanApplicationResponse> getApplications(
            @RequestParam(required = false) String type){

        return applicationService.getAllApplications(type);
    }



    @GetMapping("/{id}")
    public LoanApplicationResponse getApplication(
            @PathVariable Long id){

        return applicationService.getApplicationById(id);
    }



    @PutMapping("/{id}")
    public LoanApplicationResponse updateApplication(
            @PathVariable Long id,
            @RequestBody LoanApplicationRequest request){

        return applicationService.updateApplication(id, request);
    }



    @PostMapping("/{id}/submit")
    public LoanApplicationResponse submitApplication(
            @PathVariable Long id){

        return applicationService.submitApplication(id);
    }



    @DeleteMapping("/{id}")
    public void deleteApplication(
            @PathVariable Long id){

        applicationService.deleteApplication(id);
    }

    @GetMapping("/{id}/history")
    public java.util.Map<String, Object> getApplicationHistory(
            @PathVariable Long id){
        return applicationService.getApplicationHistory(id);
    }
}