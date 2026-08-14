package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.Business;
import com.loansystem.loan.domain.entity.BusinessOwner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessRepository extends JpaRepository<Business, Long> {

    List<Business> findByOwner(BusinessOwner owner);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByTinNumber(String tinNumber);

    List<Business> findByBusinessType(String businessType);
}