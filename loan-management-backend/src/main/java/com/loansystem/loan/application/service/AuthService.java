package com.loansystem.loan.application.service;

import com.loansystem.loan.application.dto.request.ForgotPasswordRequest;
import com.loansystem.loan.application.dto.request.LoginRequest;
import com.loansystem.loan.application.dto.request.RegisterRequest;
import com.loansystem.loan.application.dto.request.ResetPasswordRequest;
import com.loansystem.loan.application.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    String forgotPassword(ForgotPasswordRequest request);

    String resetPassword(ResetPasswordRequest request);
}