package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DashboardServiceBeanTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void dashboardServiceBeanShouldBeRegistered() {
        assertThat(applicationContext.getBean(DashboardService.class)).isNotNull();
    }
}
