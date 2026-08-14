package com.loansystem.loan.infrastructure.controller;


import com.loansystem.loan.application.dto.request.ForgotPasswordRequest;
import com.loansystem.loan.application.dto.request.LoginRequest;
import com.loansystem.loan.application.dto.request.RegisterRequest;
import com.loansystem.loan.application.dto.request.ResetPasswordRequest;
import com.loansystem.loan.application.dto.response.AuthResponse;
import com.loansystem.loan.application.service.AuthService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {


    private final AuthService authService;



    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody RegisterRequest request){

        return ResponseEntity.ok(
                authService.register(request)
        );
    }



    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request){

        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @RequestBody ForgotPasswordRequest request){

        return ResponseEntity.ok(
                authService.forgotPassword(request)
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestBody ResetPasswordRequest request){

        return ResponseEntity.ok(
                authService.resetPassword(request)
        );
    }

}