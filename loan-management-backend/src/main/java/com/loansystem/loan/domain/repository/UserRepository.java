package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    List<User> findByRole(Role role);

    Optional<User> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);
}