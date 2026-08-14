package com.loansystem.loan.application.service.impl;


import com.loansystem.loan.application.dto.request.LoginRequest;
import com.loansystem.loan.application.dto.request.RegisterRequest;
import com.loansystem.loan.application.dto.request.UpdateUserRequest;
import com.loansystem.loan.application.dto.response.LoginResponse;
import com.loansystem.loan.application.dto.response.UserResponse;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.application.mapper.UserMapper;
import com.loansystem.loan.domain.repository.UserRepository;
import com.loansystem.loan.application.service.UserService;
import com.loansystem.loan.domain.enums.UserStatus;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {


    private final UserRepository userRepository;

    private final UserMapper userMapper;



    @Override
    public UserResponse getUserById(Long id) {


        User user = userRepository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException("User not found")
                );


        return userMapper.toResponse(user);
    }



    @Override
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }



    @Override
    public UserResponse updateUser(
            Long id,
            UpdateUserRequest request) {


        User user = userRepository.findById(id)
                .orElseThrow();

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getEligibilityStatus() != null) {
            user.setEligibilityStatus(request.getEligibilityStatus());
        }
        if (request.getAccountNumber() != null) {
            String acct = request.getAccountNumber().trim();
            if (!acct.matches("\\d{13}")) {
                throw new RuntimeException("Account number must be exactly 13 digits");
            }
            // Reject if another user already owns that account number
            userRepository.findByAccountNumber(acct)
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new RuntimeException("Account number already in use");
                        }
                    });
            user.setAccountNumber(acct);
        }

        userRepository.save(user);

        return userMapper.toResponse(user);
    }



    @Override
    public void deleteUser(Long id) {

        userRepository.deleteById(id);
    }

    @Override
    public UserResponse activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(UserStatus.ACTIVE);
        user.setEnabled(true);
        userRepository.save(user);
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse registerCustomer(RegisterRequest request) {
        return null;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        return null;
    }
}