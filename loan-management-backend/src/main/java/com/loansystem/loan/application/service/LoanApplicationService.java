package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.request.LoanApplicationRequest;
import com.loansystem.loan.application.dto.response.LoanApplicationResponse;

import java.util.List;

public interface LoanApplicationService {


    LoanApplicationResponse applyLoan(
            LoanApplicationRequest request);


    List<LoanApplicationResponse> getAllApplications();


    LoanApplicationResponse getApplicationById(Long id);


    LoanApplicationResponse updateApplication(Long id, LoanApplicationRequest request);


    LoanApplicationResponse submitApplication(Long id);


    void deleteApplication(Long id);

    java.util.Map<String, Object> getApplicationHistory(Long id);
}