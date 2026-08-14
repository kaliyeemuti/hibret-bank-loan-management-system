package com.loansystem.loan.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "banks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(name = "bank_name", nullable = false)
    private String bankName;


    @Column(name = "branch_name", nullable = false)
    private String branchName;


    @Column(name = "address")
    private String address;


    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "ACTIVE";


    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;


    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    // One bank can have many accounts
    @OneToMany(
            mappedBy = "bank",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    @JsonIgnore
    private List<Account> accounts = new ArrayList<>();


    @PrePersist
    public void onCreate() {

        createdAt = LocalDateTime.now();

        if(status == null){
            status = "ACTIVE";
        }
    }


    @PreUpdate
    public void onUpdate() {

        updatedAt = LocalDateTime.now();

    }
}