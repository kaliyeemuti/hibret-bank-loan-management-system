package com.loansystem.loan.application.mapper;

import com.loansystem.loan.application.dto.request.LoanProductRequest;
import com.loansystem.loan.application.dto.response.LoanProductResponse;
import com.loansystem.loan.domain.entity.LoanProduct;
import org.springframework.stereotype.Component;

@Component
public class LoanProductMapper {

    public LoanProduct toEntity(LoanProductRequest request){

        return LoanProduct.builder()
                .name(request.getName())
                .description(request.getDescription())
                .interestRate(request.getInterestRate())
                .minimumAmount(request.getMinimumAmount())
                .maximumAmount(request.getMaximumAmount())
                .repaymentPeriodMonths(request.getRepaymentPeriodMonths())
                .processingFee(request.getProcessingFee())
                .build();
    }


    public LoanProductResponse toResponse(LoanProduct product){

        return LoanProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .interestRate(product.getInterestRate())
                .minimumAmount(product.getMinimumAmount())
                .maximumAmount(product.getMaximumAmount())
                .repaymentPeriodMonths(product.getRepaymentPeriodMonths())
                .processingFee(product.getProcessingFee())
                .build();
    }
}