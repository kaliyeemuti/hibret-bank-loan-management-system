package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.CustomerAccount;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.CustomerAccountType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerAccountRepository extends JpaRepository<CustomerAccount, Long> {

    List<CustomerAccount> findByOwner(User owner);

    Optional<CustomerAccount> findByOwnerAndAccountType(User owner, CustomerAccountType type);

    Optional<CustomerAccount> findByAccountNumber(String accountNumber);

    /**
     * Pessimistic write lock — used when updating the balance inside a
     * transaction to prevent concurrent over-drafts.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ca FROM CustomerAccount ca WHERE ca.owner = :owner AND ca.accountType = :type")
    Optional<CustomerAccount> findByOwnerAndTypeWithLock(
            @Param("owner") User owner,
            @Param("type")  CustomerAccountType type);
}
