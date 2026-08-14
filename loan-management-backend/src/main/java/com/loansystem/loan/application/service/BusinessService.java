package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.request.BusinessRequest;
import com.loansystem.loan.application.dto.response.BusinessResponse;

import java.util.List;

public interface BusinessService {

    BusinessResponse createBusiness(
            BusinessRequest request);

    BusinessResponse getBusinessById(Long id);

    List<BusinessResponse> getAllBusinesses();

    void deleteBusiness(Long id);
}