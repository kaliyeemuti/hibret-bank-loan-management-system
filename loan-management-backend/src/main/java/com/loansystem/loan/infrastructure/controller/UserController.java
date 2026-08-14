package com.loansystem.loan.infrastructure.controller;


import com.loansystem.loan.application.dto.request.UpdateUserRequest;
import com.loansystem.loan.application.dto.response.UserResponse;
import com.loansystem.loan.application.service.NotificationService;
import com.loansystem.loan.application.service.UserService;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.EligibilityStatus;
import com.loansystem.loan.domain.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;



    @GetMapping
    public List<UserResponse> getAllUsers(){

        return userService.getAllUsers();
    }



    @GetMapping("/{id}")
    public UserResponse getUserById(
            @PathVariable Long id){

        return userService.getUserById(id);
    }



    @DeleteMapping("/{id}")
    public void deleteUser(
            @PathVariable Long id){

        userService.deleteUser(id);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request){

        return userService.updateUser(id, request);
    }

    @PatchMapping("/{id}/activate")
    public UserResponse activateUser(
            @PathVariable Long id){

        return userService.activateUser(id);
    }

    /**
     * Admin-only: change a customer's eligibility status.
     * Body: { "eligibilityStatus": "ELIGIBLE" }
     * When restored to ELIGIBLE, a notification is sent to the customer.
     */
    @PatchMapping("/{id}/eligibility")
    public UserResponse updateEligibility(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String statusStr = body.get("eligibilityStatus");
        if (statusStr == null) {
            throw new RuntimeException("eligibilityStatus is required");
        }

        EligibilityStatus newStatus;
        try {
            newStatus = EligibilityStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid eligibilityStatus: " + statusStr);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        EligibilityStatus previousStatus = user.getEligibilityStatus();
        user.setEligibilityStatus(newStatus);
        userRepository.save(user);

        // Notify the customer when admin restores eligibility
        if (previousStatus == EligibilityStatus.NOT_ELIGIBLE
                && newStatus == EligibilityStatus.ELIGIBLE) {
            notificationService.sendNotification(user,
                    "Loan Eligibility Restored",
                    "Your loan eligibility has been restored by an administrator. "
                            + "You may now apply for a new loan.",
                    "ELIGIBILITY_RESTORED");
        }

        return userService.getUserById(id);
    }

}