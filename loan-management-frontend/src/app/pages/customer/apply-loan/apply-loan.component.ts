import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

interface LoanProduct {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  interestRate: string;
  tenure: string;
  description: string;
}

@Component({
  selector: 'app-apply-loan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>Apply for a Loan</h1>
          <p>Create a new loan application draft</p>
        </div>
      </div>

      <div class="page-content">
        <div class="form-card">

          <!-- ── NOT ELIGIBLE banner ────────────────────────────────────── -->
          <div *ngIf="notEligible"
               style="background:#fde8e8;border-left:4px solid var(--danger);padding:20px 24px;border-radius:6px;margin-bottom:24px;">
            <h3 style="margin:0 0 8px;color:var(--danger);">⛔ Not Eligible for a New Loan</h3>
            <p style="margin:0;font-size:14px;line-height:1.6;">
              You currently have an active or recently approved loan, so you are
              <strong>not eligible</strong> to apply for another loan at this time.<br><br>
              Please contact an <strong>administrator</strong> to have your eligibility restored
              once your current loan obligations are satisfied.
            </p>
          </div>

          <!-- ── Success state ─────────────────────────────────────────── -->
          <div *ngIf="success && !notEligible"
               style="text-align:center;padding:40px 0;">
            <div style="font-size:60px;margin-bottom:20px;color:var(--success);">✓</div>
            <h2 style="color:var(--primary-teal)">Draft Saved!</h2>
            <p>Your loan application has been saved as a draft.</p>
            <p>Go to My Applications to review, edit, and submit it.</p>
          </div>

          <!-- ── Application form ──────────────────────────────────────── -->
          <div *ngIf="!success && !notEligible">
            <div *ngIf="error" class="error-message" style="margin-bottom:16px;">{{ error }}</div>

            <form [formGroup]="applyForm" class="form-layout">
              <div class="form-group">
                <label for="loanType">Loan Type *</label>
                <select id="loanType" formControlName="loanType">
                  <option *ngFor="let lt of loanProducts()" [value]="lt.name">
                    {{ lt.name }} ({{ lt.interestRate }})
                  </option>
                </select>
              </div>

              <div *ngIf="selectedLoan()"
                   style="margin:10px 0 20px;background:rgba(0,175,169,.05);padding:12px;
                          border-left:4px solid var(--primary-teal);border-radius:4px;font-size:14px;">
                <strong>Loan Details:</strong>
                Min: {{ selectedLoan()?.minAmount?.toLocaleString() }} ETB,
                Max: {{ selectedLoan()?.maxAmount?.toLocaleString() }} ETB,
                Tenure: {{ selectedLoan()?.tenure }}
              </div>

              <div class="form-group">
                <label for="amount">Loan Amount *</label>
                <input type="number" id="amount" formControlName="amount" placeholder="Enter amount" />
                <div *ngIf="applyForm.get('amount')?.touched && applyForm.get('amount')?.invalid"
                     style="color:var(--danger);font-size:12px;margin-top:4px;">
                  Amount is required.
                </div>
              </div>

              <div class="form-group">
                <label for="purpose">Purpose of Loan *</label>
                <textarea id="purpose" formControlName="purpose"
                          placeholder="Describe the purpose of this loan"></textarea>
                <div *ngIf="applyForm.get('purpose')?.touched && applyForm.get('purpose')?.invalid"
                     style="color:var(--danger);font-size:12px;margin-top:4px;">
                  Purpose is required.
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-primary btn-large"
                        (click)="saveAsDraft()" [disabled]="loading">
                  {{ loading ? 'Saving...' : 'Save as Draft' }}
                </button>
                <button type="button" class="btn btn-success btn-large"
                        (click)="submitApplication()" [disabled]="loading"
                        style="margin-left:8px;">
                  {{ loading ? 'Submitting...' : 'Submit Application' }}
                </button>
                <button type="button" class="btn btn-outline btn-large"
                        (click)="handleCancel()" style="margin-left:8px;">
                  Cancel
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ApplyLoanComponent implements OnInit {
  fb          = inject(FormBuilder);
  loanService = inject(LoanService);
  authService = inject(AuthService);
  router      = inject(Router);

  loanProducts = signal<LoanProduct[]>([]);
  notEligible  = false;
  error        = '';
  success      = false;
  loading      = false;

  applyForm = this.fb.group({
    loanType: ['', [Validators.required]],
    amount:   ['', [Validators.required, Validators.min(1)]],
    purpose:  ['', [Validators.required]]
  });

  selectedLoan = computed(() => {
    const name = this.applyForm.get('loanType')?.value;
    return this.loanProducts().find(lt => lt.name === name) || null;
  });

  ngOnInit() {
    // 1. Check eligibility from the current session first (fast path)
    const sessionUser = this.authService.currentUser();
    if (sessionUser?.id) {
      this.loanService.getUserById(sessionUser.id).subscribe({
        next: (u: any) => {
          if (u.eligibilityStatus === 'NOT_ELIGIBLE') {
            this.notEligible = true;
          }
        },
        error: () => { /* silent — backend enforces anyway */ }
      });
    }

    // 2. Load loan products
    this.loanService.getLoanProducts().subscribe({
      next: (products) => {
        if (products?.length) {
          const mapped = products.map((p: any) => ({
            id:           p.id,
            name:         p.name || 'Loan',
            minAmount:    Number(p.minimumAmount ?? p.minAmount ?? 0),
            maxAmount:    Number(p.maximumAmount ?? p.maxAmount ?? 0),
            interestRate: p.interestRate ? `${p.interestRate}%` : '',
            tenure:       p.repaymentPeriodMonths ? `${p.repaymentPeriodMonths} months` : '',
            description:  p.description || ''
          }));
          this.loanProducts.set(mapped);
          if (mapped.length) this.applyForm.patchValue({ loanType: mapped[0].name });
        }
      },
      error: () => { this.error = 'Failed to load loan products.'; }
    });

    // Business ID is intentionally NOT fetched here.
    // The backend resolves the correct business from the JWT-authenticated user,
    // creating one automatically if needed. Sending a hardcoded businessId would
    // assign every customer's application to the same (first) business.
  }

  private buildPayload() {
    const selected  = this.selectedLoan();
    const amountVal = parseFloat(this.applyForm.value.amount || '0');

    if (selected && (amountVal < selected.minAmount || amountVal > selected.maxAmount)) {
      this.error = `Amount must be between ${selected.minAmount.toLocaleString()} and ${selected.maxAmount.toLocaleString()} ETB`;
      return null;
    }

    // Do NOT include businessId — the backend resolves it from the JWT user identity
    return {
      loanProductId:   selected?.id,
      requestedAmount: amountVal,
      purpose:         this.applyForm.value.purpose || ''
    };
  }

  saveAsDraft() {
    if (this.applyForm.invalid) { this.applyForm.markAllAsTouched(); return; }
    this.error   = '';
    const payload = this.buildPayload();
    if (!payload) return;

    this.loading = true;
    this.loanService.applyForLoan(payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/customer/applications']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.message || 'Failed to save loan application.';
        // Surface eligibility errors clearly
        if (this.error.toLowerCase().includes('not eligible') ||
            this.error.toLowerCase().includes('eligible')) {
          this.notEligible = true;
        }
      }
    });
  }

  submitApplication() {
    if (this.applyForm.invalid) { this.applyForm.markAllAsTouched(); return; }
    this.error   = '';
    const payload = this.buildPayload();
    if (!payload) return;

    this.loading = true;
    this.loanService.applyForLoan(payload).subscribe({
      next: (response) => {
        this.loanService.submitApplication(response.id).subscribe({
          next: () => {
            this.loading = false;
            this.success = true;
            setTimeout(() => this.router.navigate(['/customer/applications']), 2000);
          },
          error: (err) => {
            this.loading = false;
            this.error   = err.error?.message || 'Failed to submit loan application.';
            if (this.error.toLowerCase().includes('not eligible') ||
                this.error.toLowerCase().includes('eligible')) {
              this.notEligible = true;
            }
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.message || 'Failed to save loan application.';
        if (this.error.toLowerCase().includes('not eligible') ||
            this.error.toLowerCase().includes('eligible')) {
          this.notEligible = true;
        }
      }
    });
  }

  handleCancel() { this.router.navigate(['/customer/dashboard']); }
}
