package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.BusinessOwner;
import com.loansystem.loan.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessOwnerRepository extends JpaRepository<BusinessOwner, Long> {


    Optional<BusinessOwner> findByNationalId(String nationalId);

    Optional<BusinessOwner> findByUser(User user);

    Optional<BusinessOwner> findByUserId(Long userId);

    boolean existsByNationalId(String nationalId);
}