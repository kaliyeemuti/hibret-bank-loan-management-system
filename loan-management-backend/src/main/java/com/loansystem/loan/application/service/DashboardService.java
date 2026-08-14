package com.loansystem.loan.application.service;

import java.util.Map;

public interface DashboardService {

    Map<String, Object> getCustomerStats();

    Map<String, Object> getLoanOfficerStats();

    Map<String, Object> getManagerStats();

    Map<String, Object> getAdminStats();

    Map<String, Object> getBankStats();
}

