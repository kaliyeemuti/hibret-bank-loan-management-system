package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.request.BusinessOwnerRequest;
import com.loansystem.loan.application.dto.response.BusinessOwnerResponse;

import java.util.List;

public interface BusinessOwnerService {

    BusinessOwnerResponse createOwner(
            BusinessOwnerRequest request);

    BusinessOwnerResponse getOwnerById(Long id);

    List<BusinessOwnerResponse> getAllOwners();

    void deleteOwner(Long id);
}