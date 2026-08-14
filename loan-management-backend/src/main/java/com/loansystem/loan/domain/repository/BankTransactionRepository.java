package com.loansystem.loan.domain.repository;

import com.loansystem.loan.domain.entity.BankTransaction;
import com.loansystem.loan.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, Long> {
    List<BankTransaction> findByLoanApplicationId(Long loanApplicationId);

    List<BankTransaction> findByTransactionDateBetween(LocalDateTime start, LocalDateTime end);
    List<BankTransaction> findAllByOrderByTransactionDateDesc();

    // Customer-scoped: used ONLY with JWT-derived user, never a client-supplied ID
    List<BankTransaction> findByCustomerOrderByTransactionDateDesc(User customer);
}
