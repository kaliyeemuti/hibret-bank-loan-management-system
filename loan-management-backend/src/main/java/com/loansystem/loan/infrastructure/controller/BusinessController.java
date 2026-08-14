package com.loansystem.loan.infrastructure.controller;


import com.loansystem.loan.application.dto.request.BusinessRequest;
import com.loansystem.loan.application.dto.response.BusinessResponse;
import com.loansystem.loan.application.service.BusinessService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/api/businesses")
@RequiredArgsConstructor
public class BusinessController {


    private final BusinessService businessService;



    @PostMapping
    public BusinessResponse createBusiness(
            @RequestBody BusinessRequest request){

        return businessService.createBusiness(request);
    }



    @GetMapping
    public List<BusinessResponse> getBusinesses(){

        return businessService.getAllBusinesses();
    }



    @GetMapping("/{id}")
    public BusinessResponse getBusiness(
            @PathVariable Long id){

        return businessService.getBusinessById(id);
    }



    @DeleteMapping("/{id}")
    public void deleteBusiness(
            @PathVariable Long id){

        businessService.deleteBusiness(id);
    }

}