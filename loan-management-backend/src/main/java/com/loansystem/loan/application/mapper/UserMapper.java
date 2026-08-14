package com.loansystem.loan.application.mapper;

import com.loansystem.loan.application.dto.request.RegisterRequest;
import com.loansystem.loan.application.dto.response.UserResponse;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.EligibilityStatus;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {


    public User toEntity(RegisterRequest request) {

        return User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .username(request.getUsername())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .password(request.getPassword())
                .role(request.getRole())
                .accountNumber(request.getAccountNumber())
                .eligibilityStatus(EligibilityStatus.ELIGIBLE)
                .build();
    }


    public UserResponse toResponse(User user) {

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .eligibilityStatus(user.getEligibilityStatus())
                .accountNumber(user.getAccountNumber())
                .build();
    }
}