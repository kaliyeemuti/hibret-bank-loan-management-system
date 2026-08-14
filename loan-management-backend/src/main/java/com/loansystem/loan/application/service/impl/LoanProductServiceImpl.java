package com.loansystem.loan.application.service.impl;


import com.loansystem.loan.application.dto.request.LoanProductRequest;
import com.loansystem.loan.application.dto.response.LoanProductResponse;
import com.loansystem.loan.domain.entity.LoanProduct;
import com.loansystem.loan.application.mapper.LoanProductMapper;
import com.loansystem.loan.domain.repository.LoanProductRepository;
import com.loansystem.loan.application.service.LoanProductService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;



@Service
@RequiredArgsConstructor
public class LoanProductServiceImpl
        implements LoanProductService {



    private final LoanProductRepository productRepository;

    private final LoanProductMapper productMapper;




    @Override
    public LoanProductResponse createProduct(
            LoanProductRequest request) {


        if(productRepository.existsByName(
                request.getName())) {

            throw new RuntimeException(
                    "Loan product already exists");
        }


        LoanProduct product =
                productMapper.toEntity(request);


        productRepository.save(product);


        return productMapper.toResponse(product);
    }





    @Override
    public List<LoanProductResponse> getActiveProducts() {


        return productRepository.findByActiveTrue()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }





    @Override
    public LoanProductResponse getProductById(Long id) {


        LoanProduct product =
                productRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Product not found")
                        );


        return productMapper.toResponse(product);
    }





    @Override
    public void deleteProduct(Long id) {

        productRepository.deleteById(id);
    }
}