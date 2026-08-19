package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.dto.request.LoanApplicationRequest;
import com.loansystem.loan.application.dto.response.LoanApplicationResponse;
import com.loansystem.loan.application.dto.response.LoanReviewResponse;
import com.loansystem.loan.domain.entity.*;
import com.loansystem.loan.domain.enums.LoanApplicationStatus;
import com.loansystem.loan.domain.enums.EligibilityStatus;
import com.loansystem.loan.application.mapper.LoanApplicationMapper;
import com.loansystem.loan.application.mapper.LoanReviewMapper;
import com.loansystem.loan.domain.repository.*;
import com.loansystem.loan.application.service.LoanApplicationService;
import com.loansystem.loan.application.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LoanApplicationServiceImpl implements LoanApplicationService {

    private final LoanApplicationRepository applicationRepository;
    private final BusinessRepository businessRepository;
    private final BusinessOwnerRepository businessOwnerRepository;
    private final UserRepository userRepository;
    private final LoanProductRepository productRepository;
    private final LoanReviewRepository reviewRepository;
    private final LoanApplicationMapper applicationMapper;
    private final LoanReviewMapper reviewMapper;
    private final NotificationService notificationService;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private Business getOrCreateCustomerBusiness(User user) {
        BusinessOwner owner = businessOwnerRepository.findByUser(user)
                .orElseGet(() -> {
                    BusinessOwner newOwner = new BusinessOwner();
                    newOwner.setUser(user);
                    newOwner.setFirstName(user.getFirstName());
                    newOwner.setLastName(user.getLastName());
                    newOwner.setEmail(user.getEmail());
                    newOwner.setPhoneNumber(user.getPhoneNumber());
                    return businessOwnerRepository.save(newOwner);
                });

        List<Business> businesses = businessRepository.findByOwner(owner);
        if (businesses.isEmpty()) {
            Business newBusiness = new Business();
            newBusiness.setOwner(owner);
            newBusiness.setBusinessName(user.getFirstName() + "'s Business");
            newBusiness.setBusinessType("General Services");
            newBusiness.setAddress("Addis Ababa, Ethiopia");
            newBusiness.setPhoneNumber(user.getPhoneNumber());
            newBusiness.setEmail(user.getEmail());
            return businessRepository.save(newBusiness);
        }
        return businesses.get(0);
    }

    @Override
    public LoanApplicationResponse applyLoan(LoanApplicationRequest request) {
        User user = getAuthenticatedUser();
        if (user.getEligibilityStatus() == EligibilityStatus.NOT_ELIGIBLE) {
            throw new RuntimeException("You are not eligible to apply for a new loan at this time.");
        }
        Business business;
        
        if (request.getBusinessId() != null) {
            business = businessRepository.findById(request.getBusinessId())
                    .orElseThrow(() -> new RuntimeException("Business not found"));
        } else {
            business = getOrCreateCustomerBusiness(user);
        }

        LoanProduct product = productRepository.findById(request.getLoanProductId())
                .orElseThrow(() -> new RuntimeException("Loan product not found"));

        if (request.getRequestedAmount() == null || request.getRequestedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Requested amount must be greater than zero");
        }

        LoanApplication application = new LoanApplication();
        application.setBusiness(business);
        application.setLoanProduct(product);
        application.setRequestedAmount(request.getRequestedAmount());
        application.setPurpose(request.getPurpose());
        application.setStatus(LoanApplicationStatus.DRAFT);
        application.setApplicationDate(LocalDate.now());

        applicationRepository.save(application);

        return applicationMapper.toResponse(application);
    }

    @Override
    public List<LoanApplicationResponse> getAllApplications(String type) {
        User user = getAuthenticatedUser();
        List<LoanApplication> allApplications = applicationRepository.findAll();

        if (user.getRole() == com.loansystem.loan.domain.enums.Role.CUSTOMER) {
            Business business = getOrCreateCustomerBusiness(user);
            return allApplications.stream()
                    .filter(app -> app.getBusiness() != null && app.getBusiness().getId().equals(business.getId()))
                    .map(applicationMapper::toResponse)
                    .toList();
        } else {
            if ("active".equalsIgnoreCase(type)) {
                if (user.getRole() == com.loansystem.loan.domain.enums.Role.LOAN_OFFICER) {
                    return allApplications.stream()
                            .filter(app -> app.getStatus() == LoanApplicationStatus.SUBMITTED)
                            .map(applicationMapper::toResponse)
                            .toList();
                } else if (user.getRole() == com.loansystem.loan.domain.enums.Role.MANAGER) {
                    return allApplications.stream()
                            .filter(app -> app.getStatus() == LoanApplicationStatus.UNDER_REVIEW)
                            .map(applicationMapper::toResponse)
                            .toList();
                }
            } else if ("history".equalsIgnoreCase(type)) {
                List<LoanReview> reviews = reviewRepository.findByReviewer(user);
                List<Long> applicationIdsReviewed = reviews.stream()
                        .map(r -> r.getLoanApplication() != null ? r.getLoanApplication().getId() : null)
                        .filter(java.util.Objects::nonNull)
                        .toList();

                if (user.getRole() == com.loansystem.loan.domain.enums.Role.LOAN_OFFICER) {
                    return allApplications.stream()
                            .filter(app -> applicationIdsReviewed.contains(app.getId()))
                            .filter(app -> app.getStatus() != LoanApplicationStatus.SUBMITTED)
                            .map(applicationMapper::toResponse)
                            .toList();
                } else if (user.getRole() == com.loansystem.loan.domain.enums.Role.MANAGER) {
                    return allApplications.stream()
                            .filter(app -> applicationIdsReviewed.contains(app.getId()))
                            .filter(app -> app.getStatus() != LoanApplicationStatus.UNDER_REVIEW)
                            .map(applicationMapper::toResponse)
                            .toList();
                }
            }

            return allApplications.stream()
                    .map(applicationMapper::toResponse)
                    .toList();
        }
    }

    @Override
    public LoanApplicationResponse getApplicationById(Long id) {
        LoanApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        return applicationMapper.toResponse(application);
    }

    @Override
    public LoanApplicationResponse updateApplication(Long id, LoanApplicationRequest request) {
        LoanApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // Only allow updates for DRAFT status
        if (application.getStatus() != LoanApplicationStatus.DRAFT) {
            throw new RuntimeException("Only draft applications can be updated");
        }

        if (request.getLoanProductId() != null) {
            LoanProduct product = productRepository.findById(request.getLoanProductId())
                    .orElseThrow(() -> new RuntimeException("Loan product not found"));
            application.setLoanProduct(product);
        }

        if (request.getRequestedAmount() != null) {
            if (request.getRequestedAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Requested amount must be greater than zero");
            }
            application.setRequestedAmount(request.getRequestedAmount());
        }

        if (request.getPurpose() != null) {
            application.setPurpose(request.getPurpose());
        }

        applicationRepository.save(application);
        return applicationMapper.toResponse(application);
    }

    @Override
    public LoanApplicationResponse submitApplication(Long id) {
        LoanApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != LoanApplicationStatus.DRAFT) {
            throw new RuntimeException("Only draft applications can be submitted");
        }

        User user = getAuthenticatedUser();
        if (user.getEligibilityStatus() == EligibilityStatus.NOT_ELIGIBLE) {
            throw new RuntimeException("You are not eligible to submit a loan application at this time.");
        }

        application.setStatus(LoanApplicationStatus.SUBMITTED);
        application.setApplicationDate(LocalDate.now());
        applicationRepository.save(application);

        // Send submission notification
        user = getAuthenticatedUser();
        notificationService.sendNotification(user, "Application Submitted",
                "Your loan application " + application.getApplicationNumber() + " has been submitted successfully.",
                "LOAN_SUBMITTED");

        return applicationMapper.toResponse(application);
    }

    @Override
    public void deleteApplication(Long id) {
        LoanApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != LoanApplicationStatus.DRAFT) {
            throw new RuntimeException("Only draft applications can be deleted");
        }

        applicationRepository.deleteById(id);
    }

    @Override
    public Map<String, Object> getApplicationHistory(Long id) {
        LoanApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        List<LoanReview> reviews = reviewRepository.findByLoanApplication(application);
        List<LoanReviewResponse> reviewResponses = reviews.stream()
                .map(reviewMapper::toResponse)
                .toList();

        Map<String, Object> history = new HashMap<>();
        history.put("application", applicationMapper.toResponse(application));
        history.put("reviews", reviewResponses);
        return history;
    }
}