package com.loansystem.loan.infrastructure.controller;


import com.loansystem.loan.application.dto.request.BusinessOwnerRequest;
import com.loansystem.loan.application.dto.response.BusinessOwnerResponse;
import com.loansystem.loan.application.service.BusinessOwnerService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/api/business-owners")
@RequiredArgsConstructor
public class BusinessOwnerController {


    private final BusinessOwnerService ownerService;



    @PostMapping
    public BusinessOwnerResponse createOwner(
            @RequestBody BusinessOwnerRequest request){

        return ownerService.createOwner(request);
    }



    @GetMapping
    public List<BusinessOwnerResponse> getAllOwners(){

        return ownerService.getAllOwners();
    }



    @GetMapping("/{id}")
    public BusinessOwnerResponse getOwner(
            @PathVariable Long id){

        return ownerService.getOwnerById(id);
    }



    @DeleteMapping("/{id}")
    public void deleteOwner(
            @PathVariable Long id){

        ownerService.deleteOwner(id);
    }

}