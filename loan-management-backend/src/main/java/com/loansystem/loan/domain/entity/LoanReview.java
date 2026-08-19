package com.loansystem.loan.domain.entity;

import com.loansystem.loan.domain.enums.ReviewDecision;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "loan_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewer;

    @Enumerated(EnumType.STRING)
    private
    ReviewDecision decision;

    @Column(length = 1000)
    private String comments;

    @Column(name = "review_date")
    private LocalDateTime reviewDate;

    @PrePersist
    public void onCreate() {
        reviewDate = LocalDateTime.now();
    }
}