import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../../core/services/loan.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

interface LoanApplication {
  id: number;
  applicationNumber: string;
  customerName: string;
  loanProductName: string;
  requestedAmount: number;
  status: string;
  reviewerName?: string;
  purpose?: string;
  reviewComments?: string;
}

@Component({
  selector: 'app-manager-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>Loan Approvals</h1>
          <p>Review and approve/reject loan applications forwarded by loan officers</p>
        </div>
      </div>

      <div class="page-content">
        <div *ngIf="successMsg" class="success-message" style="margin-bottom: 20px;">
          {{ successMsg }}
        </div>
        <div *ngIf="errorMsg" class="error-message" style="margin-bottom: 20px;">
          {{ errorMsg }}
        </div>

        <div style="display: grid; grid-template-columns: 1fr;" [style.grid-template-columns]="selectedApp() ? '3fr 2fr' : '1fr'">
          <div class="table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Application #</th>
                    <th>Customer</th>
                    <th>Loan Type</th>
                    <th>Amount</th>
                    <th>Reviewed By</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let app of reviewedApps()" [class.selected]="selectedApp()?.id === app.id">
                    <td>{{ app.applicationNumber }}</td>
                    <td>{{ app.customerName }}</td>
                    <td>{{ app.loanProductName }}</td>
                    <td>\${{ app.requestedAmount.toLocaleString() }}</td>
                    <td>{{ app.reviewerName || 'Loan Officer' }}</td>
                    <td>
                      <span class="status-badge" [ngClass]="app.status.toLowerCase().replace('_', '')">
                        {{ app.status.replace('_', ' ') }}
                      </span>
                    </td>
                    <td>
                      <button class="btn-small" (click)="selectApp(app)">Decide</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="reviewedApps().length === 0" class="empty-state">
              <p>No loan applications currently awaiting manager approval.</p>
            </div>
          </div>

          <div *ngIf="selectedApp()" class="form-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2>Manager Decision</h2>
              <button class="btn-small btn-ghost" (click)="selectedApp.set(null)">✕ Close</button>
            </div>

            <div style="background-color: var(--light-bg); padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 14px;">
              <p style="margin-bottom: 8px;"><strong>Application #:</strong> {{ selectedApp()?.applicationNumber }}</p>
              <p style="margin-bottom: 8px;"><strong>Customer:</strong> {{ selectedApp()?.customerName }}</p>
              <p style="margin-bottom: 8px;"><strong>Amount:</strong> \${{ selectedApp()?.requestedAmount?.toLocaleString() }}</p>
              <p style="margin-bottom: 8px;"><strong>Purpose:</strong> {{ selectedApp()?.purpose || 'N/A' }}</p>
              <p style="margin-bottom: 0;"><strong>Officer Comments:</strong> {{ selectedApp()?.reviewComments || 'N/A' }}</p>
            </div>

            <form (ngSubmit)="submitDecision()" class="form-layout" style="gap: 15px;">
              <div class="form-group">
                <label for="decision">Decision *</label>
                <select id="decision" [(ngModel)]="decisionForm.decision" name="decision">
                  <option value="APPROVED">Approve</option>
                  <option value="REJECTED">Reject</option>
                  <option value="REQUEST_MORE_INFORMATION">Request More Information</option>
                </select>
              </div>

              <div class="form-group">
                <label for="comments">Comments *</label>
                <textarea id="comments" [(ngModel)]="decisionForm.comments" name="comments" placeholder="Enter your decision comments..." required></textarea>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="loading || !decisionForm.comments">
                  {{ loading ? 'Submitting...' : 'Submit Decision' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApprovalsComponent implements OnInit {
  loanService = inject(LoanService);
  dashboardService = inject(DashboardService);
  transactionService = inject(TransactionService);

  applications = signal<LoanApplication[]>([]);
  selectedApp = signal<LoanApplication | null>(null);

  successMsg = '';
  errorMsg = '';
  loading = false;

  decisionForm = {
    decision: 'APPROVED',
    comments: ''
  };

  reviewedApps = computed(() => this.applications().filter(app => app.status === 'UNDER_REVIEW'));

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loanService.getLoanApplications().subscribe({
      next: (data) => {
        const mapped = (data || []).map((a: any) => ({
          id: a.id,
          applicationNumber: a.applicationNumber || `APP-${a.id}`,
          customerName: a.customerName || 'Customer',
          loanProductName: a.loanProductName || 'Loan',
          requestedAmount: Number(a.requestedAmount ?? 0),
          status: a.status || 'MANAGER_REVIEW',
          reviewerName: a.reviewerName,
          purpose: a.purpose || '',
          reviewComments: a.reviewComments
        }));
        this.applications.set(mapped);
      },
      error: (err) => {
        console.error('Error loading applications:', err);
        this.applications.set([]);
        this.errorMsg = 'Failed to load applications.';
      }
    });
  }

  selectApp(app: LoanApplication) {
    this.selectedApp.set(app);
    this.decisionForm.decision = 'APPROVED';
    this.decisionForm.comments = '';
    this.successMsg = '';
    this.errorMsg = '';
  }

  private refreshBankViews() {
    this.dashboardService.getBankStats().subscribe({
      next: () => {},
      error: () => {}
    });
    this.transactionService.getTransactions().subscribe({
      next: () => {},
      error: () => {}
    });
  }

  submitDecision() {
    const app = this.selectedApp();
    if (!app) return;

    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    const payload = {
      loanApplicationId: app.id,
      decision: this.decisionForm.decision,
      comments: this.decisionForm.comments
    };

    this.loanService.submitReview(payload).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = this.decisionForm.decision === 'APPROVED'
          ? 'Loan successfully disbursed.'
          : `Application ${this.decisionForm.decision.toLowerCase().replace('_', ' ')} successfully!`;
        this.selectedApp.set(null);
        this.loadApplications();
        this.refreshBankViews();
      },
      error: (err) => {
        console.error('Error submitting decision:', err);
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to submit decision. Please try again.';
      }
    });
  }
}
