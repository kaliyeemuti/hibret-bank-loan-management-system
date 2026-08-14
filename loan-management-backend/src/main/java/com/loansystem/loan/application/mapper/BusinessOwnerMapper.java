package com.loansystem.loan.application.mapper;

import com.loansystem.loan.application.dto.request.BusinessOwnerRequest;
import com.loansystem.loan.application.dto.response.BusinessOwnerResponse;
import com.loansystem.loan.domain.entity.BusinessOwner;
import org.springframework.stereotype.Component;


@Component
public class BusinessOwnerMapper {


    public BusinessOwner toEntity(BusinessOwnerRequest request){

        return BusinessOwner.builder()

                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .nationalId(request.getNationalId())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .address(request.getAddress())
                .occupation(request.getOccupation())
                .monthlyIncome(request.getMonthlyIncome())
                .build();
    }


    public BusinessOwnerResponse toResponse(BusinessOwner owner){

        return BusinessOwnerResponse.builder()
                .id(owner.getId())
                .firstName(owner.getFirstName())
                .lastName(owner.getLastName())
                .gender(owner.getGender())
                .nationalId(owner.getNationalId())
                .phoneNumber(owner.getPhoneNumber())
                .email(owner.getEmail())
                .build();
    }
}