package com.loansystem.loan.application.service.impl;


import com.loansystem.loan.application.dto.request.BusinessOwnerRequest;
import com.loansystem.loan.application.dto.response.BusinessOwnerResponse;
import com.loansystem.loan.domain.entity.BusinessOwner;
import com.loansystem.loan.application.mapper.BusinessOwnerMapper;
import com.loansystem.loan.domain.repository.BusinessOwnerRepository;
import com.loansystem.loan.application.service.BusinessOwnerService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class BusinessOwnerServiceImpl implements BusinessOwnerService {


    private final BusinessOwnerRepository ownerRepository;

    private final BusinessOwnerMapper ownerMapper;



    @Override
    public BusinessOwnerResponse createOwner(
            BusinessOwnerRequest request) {


        if(ownerRepository.existsByNationalId(
                request.getNationalId())) {

            throw new RuntimeException(
                    "National ID already exists");
        }


        BusinessOwner owner =
                ownerMapper.toEntity(request);


        ownerRepository.save(owner);


        return ownerMapper.toResponse(owner);
    }



    @Override
    public BusinessOwnerResponse getOwnerById(Long id) {


        BusinessOwner owner =
                ownerRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Owner not found")
                        );


        return ownerMapper.toResponse(owner);
    }



    @Override
    public List<BusinessOwnerResponse> getAllOwners() {


        return ownerRepository.findAll()
                .stream()
                .map(ownerMapper::toResponse)
                .toList();
    }



    @Override
    public void deleteOwner(Long id) {

        ownerRepository.deleteById(id);
    }
}