package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.request.LoginRequest;
import com.loansystem.loan.application.dto.request.RegisterRequest;
import com.loansystem.loan.application.dto.request.UpdateUserRequest;
import com.loansystem.loan.application.dto.response.LoginResponse;
import com.loansystem.loan.application.dto.response.UserResponse;
import jakarta.validation.Valid;

import java.util.List;

public interface UserService {

    UserResponse getUserById(Long id);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);

    UserResponse activateUser(Long id);

    UserResponse registerCustomer(@Valid RegisterRequest request);

    LoginResponse login(@Valid LoginRequest request);
}