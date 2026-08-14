package com.loansystem.loan.application.service.impl;


import com.loansystem.loan.application.dto.request.ForgotPasswordRequest;
import com.loansystem.loan.application.dto.request.LoginRequest;
import com.loansystem.loan.application.dto.request.RegisterRequest;
import com.loansystem.loan.application.dto.request.ResetPasswordRequest;
import com.loansystem.loan.application.dto.response.AuthResponse;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.application.mapper.UserMapper;
import com.loansystem.loan.domain.repository.UserRepository;
import com.loansystem.loan.infrastructure.security.JwtTokenProvider;
import com.loansystem.loan.application.service.AuthService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;



@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {


    private final UserRepository userRepository;

    private final UserMapper userMapper;

    private final PasswordEncoder passwordEncoder;

    private final JwtTokenProvider jwtTokenProvider;

    // In-memory token storage (in production, use database with expiration)
    private final Map<String, String> resetTokens = new HashMap<>();



    @Override
    public AuthResponse register(
            RegisterRequest request) {


        if(userRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("Email already exists");
        }

        // Validate account number format
        String acctNum = request.getAccountNumber();
        if (acctNum == null || !acctNum.matches("\\d{13}")) {
            throw new RuntimeException("Account number must be exactly 13 digits");
        }

        // Reject duplicate account numbers
        if (userRepository.existsByAccountNumber(acctNum)) {
            throw new RuntimeException("Account number already in use");
        }


        User user = userMapper.toEntity(request);


        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );


        userRepository.save(user);



        return AuthResponse.builder()
                .message("Registration successful")
                .build();

    }



    @Override
    public AuthResponse login(
            LoginRequest request) {


        User user =
                userRepository.findByEmail(request.getEmail())
                        .orElseThrow(
                                () -> new BadCredentialsException("Invalid credentials")
                        );



        if(!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())){


            throw new BadCredentialsException(
                    "Invalid credentials");
        }



        return AuthResponse.builder()
                .message("Login successful")
                .token(jwtTokenProvider.generateToken(user.getEmail()))
                .email(user.getEmail())
                .role(user.getRole().name())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .id(user.getId())
                .build();
    }

    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        // For security, always return success message even if email doesn't exist
        if (user == null) {
            return "If an account exists with this email, a password reset link has been sent.";
        }

        // Generate a secure reset token
        String resetToken = UUID.randomUUID().toString();
        
        // Store the token associated with the user's email
        // In production, this should be stored in database with expiration time
        resetTokens.put(resetToken, user.getEmail());

        // In a real application, you would send an email here with the reset link
        // For demo purposes, we'll log the token (in production, remove this)
        System.out.println("Password reset token for " + user.getEmail() + ": " + resetToken);
        System.out.println("Reset link: http://localhost:4200/reset-password?token=" + resetToken);

        return "If an account exists with this email, a password reset link has been sent.";
    }

    @Override
    public String resetPassword(ResetPasswordRequest request) {
        String email = resetTokens.get(request.getToken());

        if (email == null) {
            throw new RuntimeException("Invalid or expired reset token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update the password with BCrypt encryption
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Remove the used token
        resetTokens.remove(request.getToken());

        return "Password reset successfully";
    }
}