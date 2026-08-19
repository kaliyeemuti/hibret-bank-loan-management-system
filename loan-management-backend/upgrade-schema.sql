-- Database Migration Script
-- Run this script on your MySQL database to allow multiple reviews per loan application.
-- This enables storing both the Loan Officer's recommendation and the Manager's final decision.

-- 1. Create a non-unique index so the foreign key constraint is satisfied when we drop the unique ones
ALTER TABLE loan_reviews ADD KEY FK_loan_application_idx (loan_application_id);

-- 2. Drop the unique constraints if they exist
ALTER TABLE loan_reviews DROP INDEX UKh30dg574gisl2dpris2psyo29;
ALTER TABLE loan_reviews DROP INDEX uk_loan_reviews_application;
