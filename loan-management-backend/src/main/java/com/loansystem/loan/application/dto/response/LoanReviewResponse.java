package com.loansystem.loan.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.loansystem.loan.domain.enums.ReviewDecision; // or your custom enum path

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanReviewResponse {
    private Long id;
    private String decision; // Ensure this is String if you are using .name()
    private String comments;
    private java.time.LocalDate reviewDate;
    private String reviewerName;
    private String reviewStage;
}