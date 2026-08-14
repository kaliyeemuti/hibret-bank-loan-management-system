package com.loansystem.loan.infrastructure.config;

import com.loansystem.loan.domain.entity.Account;
import com.loansystem.loan.domain.entity.Bank;
import com.loansystem.loan.domain.entity.LoanProduct;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.enums.LoanType;
import com.loansystem.loan.domain.enums.Role;
import com.loansystem.loan.domain.enums.UserStatus;
import com.loansystem.loan.domain.repository.AccountRepository;
import com.loansystem.loan.domain.repository.BankRepository;
import com.loansystem.loan.domain.repository.LoanProductRepository;
import com.loansystem.loan.domain.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LoanProductRepository loanProductRepository;
    private final PasswordEncoder passwordEncoder;
    private final BankRepository bankRepository;
    private final AccountRepository accountRepository;

    public DataInitializer(UserRepository userRepository,
                           LoanProductRepository loanProductRepository,
                           PasswordEncoder passwordEncoder,
                           BankRepository bankRepository,
                           AccountRepository accountRepository) {
        this.userRepository = userRepository;
        this.loanProductRepository = loanProductRepository;
        this.passwordEncoder = passwordEncoder;
        this.bankRepository = bankRepository;
        this.accountRepository = accountRepository;
    }

    @Override
    public void run(String... args) throws Exception {

        // ── 1. Seed default Bank ──────────────────────────────────────────────
        Bank bank;
        if (bankRepository.count() == 0) {
            bank = bankRepository.save(Bank.builder()
                    .bankName("Hibret Bank")
                    .branchName("Main Branch")
                    .address("Addis Ababa, Ethiopia")
                    .status("ACTIVE")
                    .build());
            System.out.println("Default bank seeded.");
        } else {
            bank = bankRepository.findAll().get(0);
        }

        // ── 2. Seed 4 dedicated loan accounts (idempotent per LoanType) ─────
        // Using findByLoanType so each account is created only if it doesn't
        // exist yet. This survives partial failures from previous runs where
        // count() > 0 but not all four accounts were actually persisted.
        ensureAccount(bank, "Personal Loan Account", "ACC-PERSONAL-001", LoanType.PERSONAL_LOAN,  new BigDecimal("10000000.00"));
        ensureAccount(bank, "Home Loan Account",     "ACC-HOME-001",     LoanType.HOME_LOAN,      new BigDecimal("50000000.00"));
        ensureAccount(bank, "Auto Loan Account",     "ACC-AUTO-001",     LoanType.VEHICLE_LOAN,   new BigDecimal("20000000.00"));
        ensureAccount(bank, "Business Loan Account", "ACC-BUSINESS-001", LoanType.BUSINESS_LOAN,  new BigDecimal("30000000.00"));

        // ── 3. Seed default users ─────────────────────────────────────────────
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .firstName("Admin").lastName("User").username("admin")
                    .email("admin@gmail.com").phoneNumber("+1-800-ADMIN-01")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.ADMIN).status(UserStatus.ACTIVE).enabled(true)
                    .accountNumber("1000000000001").build());

            userRepository.save(User.builder()
                    .firstName("John").lastName("Doe").username("johndoe")
                    .email("customer@gmail.com").phoneNumber("+1-555-0100")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.CUSTOMER).status(UserStatus.ACTIVE).enabled(true)
                    .accountNumber("1000000000002").build());

            userRepository.save(User.builder()
                    .firstName("Sarah").lastName("Officer").username("sarahofficer")
                    .email("loanofficer@gmail.com").phoneNumber("+1-555-0101")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.LOAN_OFFICER).status(UserStatus.ACTIVE).enabled(true)
                    .accountNumber("1000000000003").build());

            userRepository.save(User.builder()
                    .firstName("Michael").lastName("Manager").username("michaelmanager")
                    .email("manager@gmail.com").phoneNumber("+1-555-0102")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.MANAGER).status(UserStatus.ACTIVE).enabled(true)
                    .accountNumber("1000000000004").build());

            System.out.println("Default users seeded.");
        } else {
            // Backfill account numbers for any existing user that has none.
            // Uses id-based deterministic values so it is idempotent and never
            // conflicts with the values already set for pre-existing rows.
            userRepository.findAll().forEach(u -> {
                if (u.getAccountNumber() == null) {
                    u.setAccountNumber(String.format("%013d", 1_000_000_000_000L + u.getId()));
                    userRepository.save(u);
                }
            });
        }

        // ── 4. Seed default loan products ─────────────────────────────────────
        if (loanProductRepository.count() == 0) {
            loanProductRepository.save(LoanProduct.builder()
                    .name("Personal Loan").description("Unsecured loan for personal use")
                    .interestRate(BigDecimal.valueOf(12.5))
                    .minimumAmount(BigDecimal.valueOf(10000.00))
                    .maximumAmount(BigDecimal.valueOf(500000.00))
                    .repaymentPeriodMonths(60)
                    .processingFee(BigDecimal.valueOf(150.00))
                    .active(true).build());

            loanProductRepository.save(LoanProduct.builder()
                    .name("Home Loan").description("Secured loan for property purchase")
                    .interestRate(BigDecimal.valueOf(8.5))
                    .minimumAmount(BigDecimal.valueOf(100000.00))
                    .maximumAmount(BigDecimal.valueOf(10000000.00))
                    .repaymentPeriodMonths(360)
                    .processingFee(BigDecimal.valueOf(500.00))
                    .active(true).build());

            loanProductRepository.save(LoanProduct.builder()
                    .name("Auto Loan").description("Secured loan for vehicle purchase")
                    .interestRate(BigDecimal.valueOf(10.0))
                    .minimumAmount(BigDecimal.valueOf(50000.00))
                    .maximumAmount(BigDecimal.valueOf(2000000.00))
                    .repaymentPeriodMonths(60)
                    .processingFee(BigDecimal.valueOf(200.00))
                    .active(true).build());

            loanProductRepository.save(LoanProduct.builder()
                    .name("Business Loan").description("Loan for business expansion")
                    .interestRate(BigDecimal.valueOf(14.0))
                    .minimumAmount(BigDecimal.valueOf(50000.00))
                    .maximumAmount(BigDecimal.valueOf(5000000.00))
                    .repaymentPeriodMonths(84)
                    .processingFee(BigDecimal.valueOf(1000.00))
                    .active(true).build());

            System.out.println("Default loan products seeded.");
        }
    }

    /**
     * Creates the account for the given LoanType only if one does not already
     * exist. Safe to call on every startup — never inserts a duplicate.
     */
    private void ensureAccount(Bank bank, String name, String number,
                                LoanType type, BigDecimal defaultBalance) {
        if (accountRepository.findByLoanType(type).isEmpty()) {
            accountRepository.save(Account.builder()
                    .accountName(name)
                    .accountNumber(number)
                    .loanType(type)
                    .currentBalance(defaultBalance)
                    .currency("ETB")
                    .status("ACTIVE")
                    .bank(bank)
                    .build());
            System.out.println("Seeded account: " + name);
        }
    }
}
