package com.loansystem.loan.infrastructure.controller;


import com.loansystem.loan.application.dto.request.LoanProductRequest;
import com.loansystem.loan.application.dto.response.LoanProductResponse;
import com.loansystem.loan.application.service.LoanProductService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/api/loan-products")
@RequiredArgsConstructor
public class LoanProductController {


    private final LoanProductService productService;



    @PostMapping
    public LoanProductResponse createProduct(
            @RequestBody LoanProductRequest request){

        return productService.createProduct(request);
    }



    @GetMapping("/active")
    public List<LoanProductResponse> getActiveProducts(){

        return productService.getActiveProducts();
    }



    @GetMapping("/{id}")
    public LoanProductResponse getProduct(
            @PathVariable Long id){

        return productService.getProductById(id);
    }



    @DeleteMapping("/{id}")
    public void deleteProduct(
            @PathVariable Long id){

        productService.deleteProduct(id);
    }

}