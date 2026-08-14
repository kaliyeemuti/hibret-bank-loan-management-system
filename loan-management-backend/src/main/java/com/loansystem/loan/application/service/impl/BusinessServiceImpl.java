package com.loansystem.loan.application.service.impl;


import com.loansystem.loan.application.dto.request.BusinessRequest;
import com.loansystem.loan.application.dto.response.BusinessResponse;
import com.loansystem.loan.domain.entity.Business;
import com.loansystem.loan.application.mapper.BusinessMapper;
import com.loansystem.loan.domain.repository.BusinessRepository;
import com.loansystem.loan.application.service.BusinessService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;



@Service
@RequiredArgsConstructor
public class BusinessServiceImpl implements BusinessService {


    private final BusinessRepository businessRepository;

    private final BusinessMapper businessMapper;



    @Override
    public BusinessResponse createBusiness(
            BusinessRequest request) {


        if(businessRepository.existsByRegistrationNumber(
                request.getRegistrationNumber())) {

            throw new RuntimeException(
                    "Registration number already exists");
        }


        Business business =
                businessMapper.toEntity(request);


        businessRepository.save(business);


        return businessMapper.toResponse(business);
    }



    @Override
    public BusinessResponse getBusinessById(Long id) {


        Business business =
                businessRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Business not found")
                        );


        return businessMapper.toResponse(business);
    }



    @Override
    public List<BusinessResponse> getAllBusinesses() {


        return businessRepository.findAll()
                .stream()
                .map(businessMapper::toResponse)
                .toList();
    }



    @Override
    public void deleteBusiness(Long id) {

        businessRepository.deleteById(id);
    }
}