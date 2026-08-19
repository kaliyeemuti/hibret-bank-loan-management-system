import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../../core/services/loan.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

interface LoanApplication {
  id: number;
  applicationNumber: string;
  customerName: string;
  loanProductName: string;
  requestedAmount: number;
  status: string;
  applicationDate: string;
  purpose?: string;
  reviewDecision?: string;
  reviewDate?: string;
  reviewComments?: string;
}

@Component({
  selector: 'app-review-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>Review Applications</h1>
          <p>Process submitted loan applications and view history</p>
        </div>
      </div>

      <div class="page-content">
        <div *ngIf="successMsg" class="success-message" style="margin-bottom: 20px;">
          {{ successMsg }}
        </div>
        <div *ngIf="errorMsg" class="error-message" style="margin-bottom: 20px;">
          {{ errorMsg }}
        </div>

        <!-- ACTIVE | HISTORY Tabs -->
        <div class="repayment-tabs" style="margin-bottom: 20px;">
          <button class="repayment-tab-btn" [class.active]="activeTab() === 'active'" (click)="setTab('active')">
            Active Applications
          </button>
          <button class="repayment-tab-btn" [class.active]="activeTab() === 'history'" (click)="setTab('history')">
            History
          </button>
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
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let app of displayedApps()" [class.selected]="selectedApp()?.id === app.id">
                    <td>{{ app.applicationNumber }}</td>
                    <td>{{ app.customerName }}</td>
                    <td>{{ app.loanProductName }}</td>
                    <td>ETB {{ app.requestedAmount.toLocaleString() }}</td>
                    <td>
                      <span class="status-badge" [ngClass]="app.status.toLowerCase().replace('_', '')">
                        {{ app.status.replace('_', ' ') }}
                      </span>
                    </td>
                    <td>{{ app.applicationDate }}</td>
                    <td>
                      <button class="btn-small" (click)="handleSelectApp(app)">
                        {{ activeTab() === 'active' ? 'Review' : 'View' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="displayedApps().length === 0" class="empty-state">
              <p>{{ activeTab() === 'active' ? 'No loan applications awaiting review.' : 'No review history found.' }}</p>
            </div>
          </div>

          <div *ngIf="selectedApp()" class="form-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2>Application Details</h2>
              <button class="btn-small btn-ghost" (click)="selectedApp.set(null)">✕ Close</button>
            </div>

            <div style="background-color: var(--light-bg); padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 14px;">
              <p style="margin-bottom: 8px;"><strong>Application #:</strong> {{ selectedApp()?.applicationNumber }}</p>
              <p style="margin-bottom: 8px;"><strong>Customer:</strong> {{ selectedApp()?.customerName }}</p>
              <p style="margin-bottom: 8px;"><strong>Type:</strong> {{ selectedApp()?.loanProductName }}</p>
              <p style="margin-bottom: 8px;"><strong>Amount:</strong> ETB {{ selectedApp()?.requestedAmount?.toLocaleString() }}</p>
              <p style="margin-bottom: 0;"><strong>Purpose:</strong> {{ selectedApp()?.purpose || 'N/A' }}</p>
            </div>

            <!-- Active Form View -->
            <form *ngIf="activeTab() === 'active'" (ngSubmit)="submitReview()" class="form-layout" style="gap: 15px;">
              <div class="form-group">
                <label for="decision">Decision *</label>
                <select id="decision" [(ngModel)]="reviewForm.decision" name="decision">
                  <option value="APPROVED">Recommend Approval (Forward to Manager)</option>
                  <option value="REJECTED">Recommend Rejection (Forward to Manager)</option>
                  <option value="REQUEST_MORE_INFORMATION">Request More Information</option>
                </select>
              </div>

              <div class="form-group">
                <label for="comments">Comments *</label>
                <textarea id="comments" [(ngModel)]="reviewForm.comments" name="comments" placeholder="Enter review notes..." required></textarea>
              </div>

              <div class="form-actions" style="margin-top: 10px;">
                <button type="submit" class="btn btn-primary" [disabled]="loading || !reviewForm.comments">
                  {{ loading ? 'Submitting...' : 'Submit Review' }}
                </button>
              </div>
            </form>

            <!-- History Read-Only View -->
            <div *ngIf="activeTab() === 'history'" style="background-color: #f8fafc; border: 1px solid var(--border-color); padding: 15px; border-radius: 6px;">
              <h3 style="color: var(--primary-purple); font-size: 14px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                Your Review Details (Read-Only)
              </h3>
              <p style="margin-bottom: 8px; font-size: 13.5px;">
                <strong>Recommendation:</strong>&nbsp;
                <span class="status-badge" [ngClass]="selectedApp()?.reviewDecision?.toLowerCase() === 'approved' ? 'active' : 'rejected'">
                  {{ selectedApp()?.reviewDecision === 'APPROVED' ? 'Recommend Approval' : (selectedApp()?.reviewDecision === 'REJECTED' ? 'Recommend Rejection' : 'Request More Info') }}
                </span>
              </p>
              <p style="margin-bottom: 8px; font-size: 13.5px;">
                <strong>Your Comments:</strong> {{ selectedApp()?.reviewComments || 'N/A' }}
              </p>
              <p style="margin-bottom: 8px; font-size: 13.5px;">
                <strong>Review Date:</strong> {{ selectedApp()?.reviewDate ? (selectedApp()?.reviewDate | date:'medium') : 'N/A' }}
              </p>
              <p style="margin-bottom: 0; font-size: 13.5px;">
                <strong>Current Application Status:</strong>&nbsp;
                <span class="status-badge" [ngClass]="selectedApp()?.status?.toLowerCase()?.replace('_', '') || ''">
                  {{ selectedApp()?.status?.replace('_', ' ') }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReviewApplicationsComponent implements OnInit {
  loanService = inject(LoanService);

  applications = signal<LoanApplication[]>([]);
  selectedApp = signal<LoanApplication | null>(null);
  activeTab = signal<'active' | 'history'>('active');

  loading = false;
  successMsg = '';
  errorMsg = '';

  reviewForm = {
    decision: 'APPROVED',
    comments: ''
  };

  displayedApps = computed(() => this.applications());

  ngOnInit() {
    this.loadApplications();
  }

  setTab(tab: 'active' | 'history') {
    this.activeTab.set(tab);
    this.selectedApp.set(null);
    this.successMsg = '';
    this.errorMsg = '';
    this.loadApplications();
  }

  loadApplications() {
    this.loanService.getLoanApplications(this.activeTab()).subscribe({
      next: (data) => {
        const mapped = (data || []).map((a: any) => ({
          id: a.id,
          applicationNumber: a.applicationNumber || `APP-${a.id}`,
          customerName: a.customerName || 'Customer',
          loanProductName: a.loanProductName || 'Loan',
          requestedAmount: Number(a.requestedAmount ?? 0),
          status: a.status || 'SUBMITTED',
          applicationDate: a.applicationDate || a.createdAt?.split('T')[0] || '',
          purpose: a.purpose || '',
          reviewDecision: a.reviewDecision,
          reviewDate: a.reviewDate,
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

  handleSelectApp(app: LoanApplication) {
    this.selectedApp.set(app);
    this.reviewForm.comments = '';
    this.reviewForm.decision = 'APPROVED';
    this.successMsg = '';
    this.errorMsg = '';
  }

  submitReview() {
    const app = this.selectedApp();
    if (!app) return;

    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const payload = {
      loanApplicationId: app.id,
      decision: this.reviewForm.decision,
      comments: this.reviewForm.comments
    };

    this.loanService.submitReview(payload).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Review submitted successfully!';
        this.selectedApp.set(null);
        this.loadApplications();
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to submit review. Please try again.';
      }
    });
  }
}
