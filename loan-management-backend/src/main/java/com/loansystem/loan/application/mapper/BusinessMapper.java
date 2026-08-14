package com.loansystem.loan.application.mapper;

import com.loansystem.loan.application.dto.request.BusinessRequest;
import com.loansystem.loan.application.dto.response.BusinessResponse;
import com.loansystem.loan.domain.entity.Business;
import org.springframework.stereotype.Component;


@Component
public class BusinessMapper {


    public Business toEntity(BusinessRequest request){

        return Business.builder()
                .businessName(request.getBusinessName())
                .businessType(request.getBusinessType())
                .registrationNumber(request.getRegistrationNumber())
                .tinNumber(request.getTinNumber())
                .yearsInOperation(request.getYearsInOperation())
                .annualRevenue(request.getAnnualRevenue())
                .address(request.getAddress())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .build();
    }


    public BusinessResponse toResponse(Business business){

        return BusinessResponse.builder()
                .id(business.getId())
                .businessName(business.getBusinessName())
                .businessType(business.getBusinessType())
                .registrationNumber(business.getRegistrationNumber())
                .tinNumber(business.getTinNumber())
                .yearsInOperation(business.getYearsInOperation())
                .annualRevenue(business.getAnnualRevenue())
                .build();
    }
}