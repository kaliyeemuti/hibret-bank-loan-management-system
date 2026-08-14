package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.request.LoanProductRequest;
import com.loansystem.loan.application.dto.response.LoanProductResponse;

import java.util.List;

public interface LoanProductService {


    LoanProductResponse createProduct(
            LoanProductRequest request);


    List<LoanProductResponse> getActiveProducts();


    LoanProductResponse getProductById(Long id);


    void deleteProduct(Long id);
}