package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.CustomerAccount;
import com.loansystem.loan.domain.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerAccountRepository extends JpaRepository<CustomerAccount, Long> {

    Optional<CustomerAccount> findByOwner(User owner);

    Optional<CustomerAccount> findByAccountNumber(String accountNumber);

    /**
     * Pessimistic write lock — used when updating the balance inside a
     * transaction to prevent concurrent over-drafts.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ca FROM CustomerAccount ca WHERE ca.owner = :owner")
    Optional<CustomerAccount> findByOwnerWithLock(@Param("owner") User owner);
}
