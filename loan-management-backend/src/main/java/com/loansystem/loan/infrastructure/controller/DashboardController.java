package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/customer")
    public Map<String, Object> getCustomerStats() {
        return dashboardService.getCustomerStats();
    }

    @GetMapping("/loan-officer")
    public Map<String, Object> getLoanOfficerStats() {
        return dashboardService.getLoanOfficerStats();
    }

    @GetMapping("/manager")
    public Map<String, Object> getManagerStats() {
        return dashboardService.getManagerStats();
    }

    @GetMapping("/admin")
    public Map<String, Object> getAdminStats() {
        return dashboardService.getAdminStats();
    }

    @GetMapping("/bank")
    public Map<String, Object> getBankStats() {
        return dashboardService.getBankStats();
    }
}
