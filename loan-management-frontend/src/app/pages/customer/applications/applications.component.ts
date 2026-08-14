import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../../core/services/loan.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

interface LoanApplication {
  id: number;
  applicationNumber: string;
  loanProductName: string;
  requestedAmount: number;
  interestRate: number;
  repaymentPeriodMonths: number;
  status: string;
  applicationDate: string;
  purpose: string;
  readOnly: boolean;
  reviewComments?: string;
  approvalComments?: string;
  rejectionReason?: string;
  decisionDate?: string;
}

interface RepaymentInstallment {
  id: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalPayment: number;
  remainingBalance: number;
  status: string;
  paidDate?: string;
}

interface ReviewHistory {
  id: number;
  decision: string;
  comments: string;
  reviewStage: string;
  reviewerName: string;
  reviewDate: string;
}

@Component({
  selector: 'app-customer-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>My Loan Applications</h1>
          <p>View, edit drafts, submit, and track your loan applications</p>
        </div>
      </div>

      <div class="page-content">
        <div *ngIf="successMsg" class="success-message" style="margin-bottom:20px;">{{ successMsg }}</div>
        <div *ngIf="errorMsg"   class="error-message"   style="margin-bottom:20px;">{{ errorMsg }}</div>

        <div style="display:grid;grid-template-columns:1fr;"
             [style.grid-template-columns]="selectedApp() ? '3fr 2fr' : '1fr'">

          <!-- ── Applications table ── -->
          <div class="table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Application #</th>
                    <th>Loan Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let app of applications()"
                      [class.selected]="selectedApp()?.id === app.id">
                    <td>{{ app.applicationNumber }}</td>
                    <td>{{ app.loanProductName }}</td>
                    <td>{{ app.requestedAmount | number:'1.2-2' }} ETB</td>
                    <td>
                      <span class="status-badge" [ngClass]="formatStatusClass(app.status)">
                        {{ formatStatus(app.status) }}
                      </span>
                    </td>
                    <td>{{ app.applicationDate }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-small" (click)="viewDetails(app)">View</button>
                        <button *ngIf="canEdit(app)"   class="btn-small"            (click)="startEdit(app)">Edit</button>
                        <button *ngIf="canSubmit(app)" class="btn-small btn-primary" (click)="submitApp(app)">Submit</button>
                        <button *ngIf="canDelete(app)" class="btn-small btn-danger"  (click)="deleteApp(app)">Delete</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="applications().length === 0" class="empty-state">
              <p>No loan applications found.</p>
            </div>
          </div>

          <!-- ── Detail / Edit panel ── -->
          <div *ngIf="selectedApp()" class="form-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <h2 style="margin:0;">{{ editing() ? 'Edit Application' : 'Application Details' }}</h2>
              <button class="btn-small btn-ghost" (click)="closePanel()">✕ Close</button>
            </div>

            <!-- Tab bar (only for disbursed / completed loans) -->
            <div *ngIf="hasDisbursedStatus(selectedApp()?.status)"
                 style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border-color);">
              <button (click)="activeTab='details'"
                      [style.border-bottom]="activeTab==='details' ? '3px solid var(--primary-teal)' : 'none'"
                      style="padding:8px 18px;background:none;border:none;cursor:pointer;font-weight:600;font-size:14px;">
                Details
              </button>
              <button (click)="loadSchedule(selectedApp()!.id); activeTab='schedule'"
                      [style.border-bottom]="activeTab==='schedule' ? '3px solid var(--primary-teal)' : 'none'"
                      style="padding:8px 18px;background:none;border:none;cursor:pointer;font-weight:600;font-size:14px;">
                Repayment Schedule
              </button>
            </div>

            <!-- ── Details tab ── -->
            <div *ngIf="activeTab === 'details'">
              <div *ngIf="!editing()"
                   style="background:var(--light-bg);padding:15px;border-radius:6px;margin-bottom:16px;font-size:14px;">
                <p style="margin-bottom:8px;"><strong>Application #:</strong> {{ selectedApp()?.applicationNumber }}</p>
                <p style="margin-bottom:8px;"><strong>Loan Type:</strong> {{ selectedApp()?.loanProductName }}</p>
                <p style="margin-bottom:8px;"><strong>Amount:</strong> {{ selectedApp()?.requestedAmount | number:'1.2-2' }} ETB</p>
                <p style="margin-bottom:8px;"><strong>Purpose:</strong> {{ selectedApp()?.purpose || 'N/A' }}</p>
                <p style="margin-bottom:8px;"><strong>Status:</strong>
                  <span class="status-badge" [ngClass]="formatStatusClass(selectedApp()?.status || '')">
                    {{ formatStatus(selectedApp()?.status || '') }}
                  </span>
                </p>
                <p *ngIf="selectedApp()?.interestRate" style="margin-bottom:8px;">
                  <strong>Interest Rate:</strong> {{ selectedApp()?.interestRate }}%
                </p>
                <p *ngIf="selectedApp()?.repaymentPeriodMonths" style="margin-bottom:8px;">
                  <strong>Term:</strong> {{ selectedApp()?.repaymentPeriodMonths }} months
                </p>
                <p *ngIf="selectedApp()?.decisionDate" style="margin-bottom:8px;">
                  <strong>Decision Date:</strong> {{ selectedApp()?.decisionDate | date:'medium' }}
                </p>
                <p *ngIf="selectedApp()?.reviewComments" style="margin-bottom:8px;">
                  <strong>Officer Comments:</strong> {{ selectedApp()?.reviewComments }}
                </p>
                <p *ngIf="selectedApp()?.approvalComments" style="margin-bottom:8px;">
                  <strong>Manager Comments:</strong> {{ selectedApp()?.approvalComments }}
                </p>
                <p *ngIf="selectedApp()?.rejectionReason && selectedApp()?.status === 'REJECTED'"
                   style="margin-bottom:0;color:var(--danger);">
                  <strong>Rejection Reason:</strong> {{ selectedApp()?.rejectionReason }}
                </p>
              </div>

              <!-- Edit form -->
              <form *ngIf="editing()" (ngSubmit)="saveEdit()"
                    class="form-layout" style="gap:15px;margin-bottom:20px;">
                <div class="form-group">
                  <label for="editAmount">Loan Amount *</label>
                  <input id="editAmount" type="number"
                         [(ngModel)]="editForm.requestedAmount" name="requestedAmount" required />
                </div>
                <div class="form-group">
                  <label for="editPurpose">Purpose *</label>
                  <textarea id="editPurpose"
                            [(ngModel)]="editForm.purpose" name="purpose" required></textarea>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="loading">Save Changes</button>
                </div>
              </form>

              <!-- Review history -->
              <div *ngIf="reviewHistory().length > 0">
                <h3 style="margin-bottom:12px;">Review History</h3>
                <div *ngFor="let review of reviewHistory()"
                     style="background:var(--light-bg);padding:12px;border-radius:6px;margin-bottom:10px;font-size:14px;">
                  <p style="margin-bottom:4px;"><strong>{{ review.reviewStage }}</strong> — {{ review.decision }}</p>
                  <p style="margin-bottom:4px;">By: {{ review.reviewerName || 'Reviewer' }}</p>
                  <p style="margin-bottom:4px;">{{ review.comments || 'No comments' }}</p>
                  <p style="margin-bottom:0;color:#666;font-size:12px;">{{ review.reviewDate | date:'medium' }}</p>
                </div>
              </div>
            </div>

            <!-- ── Repayment Schedule tab ── -->
            <div *ngIf="activeTab === 'schedule'">
              <div *ngIf="scheduleLoading" class="empty-state"><p>Loading schedule…</p></div>

              <div *ngIf="!scheduleLoading && schedule().length > 0">
                <!-- Summary row -->
                <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:16px;">
                  <div style="background:var(--light-bg);padding:12px 18px;border-radius:8px;flex:1;min-width:140px;">
                    <p style="margin:0;font-size:12px;opacity:.65;text-transform:uppercase;">Loan Amount</p>
                    <p style="margin:4px 0 0;font-weight:700;font-size:18px;">
                      {{ selectedApp()?.requestedAmount | number:'1.2-2' }} ETB
                    </p>
                  </div>
                  <div style="background:var(--light-bg);padding:12px 18px;border-radius:8px;flex:1;min-width:140px;">
                    <p style="margin:0;font-size:12px;opacity:.65;text-transform:uppercase;">Remaining Balance</p>
                    <p style="margin:4px 0 0;font-weight:700;font-size:18px;color:var(--primary-purple);">
                      {{ remainingBalance() | number:'1.2-2' }} ETB
                    </p>
                  </div>
                  <div style="background:var(--light-bg);padding:12px 18px;border-radius:8px;flex:1;min-width:140px;">
                    <p style="margin:0;font-size:12px;opacity:.65;text-transform:uppercase;">Installments</p>
                    <p style="margin:4px 0 0;font-weight:700;font-size:18px;">
                      {{ paidCount() }}/{{ schedule().length }} paid
                    </p>
                  </div>
                </div>

                <!-- Schedule table -->
                <div style="overflow-x:auto;">
                  <table class="data-table" style="font-size:13px;">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Due Date</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Total</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let inst of schedule()"
                          [style.background]="inst.status === 'PAID' ? '#f0fdf4' : inst.status === 'OVERDUE' ? '#fff5f5' : 'white'">
                        <td style="font-weight:600;">{{ inst.installmentNumber }}</td>
                        <td style="white-space:nowrap;">{{ inst.dueDate }}</td>
                        <td>{{ inst.principalAmount | number:'1.2-2' }}</td>
                        <td>{{ inst.interestAmount | number:'1.2-2' }}</td>
                        <td style="font-weight:600;">{{ inst.totalPayment | number:'1.2-2' }}</td>
                        <td>{{ inst.remainingBalance | number:'1.2-2' }}</td>
                        <td>
                          <span class="status-badge"
                                [ngClass]="inst.status === 'PAID' ? 'active' : inst.status === 'OVERDUE' ? 'rejected' : 'underreview'">
                            {{ inst.status }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div *ngIf="!scheduleLoading && schedule().length === 0" class="empty-state">
                <p>No repayment schedule found for this application.</p>
              </div>
            </div>

          </div><!-- /detail panel -->
        </div>
      </div>
    </div>
  `
})
export class ApplicationsComponent implements OnInit {
  loanService = inject(LoanService);

  applications  = signal<LoanApplication[]>([]);
  selectedApp   = signal<LoanApplication | null>(null);
  reviewHistory = signal<ReviewHistory[]>([]);
  schedule      = signal<RepaymentInstallment[]>([]);
  editing       = signal(false);

  activeTab      = 'details';
  scheduleLoading = false;
  loading  = false;
  successMsg = '';
  errorMsg   = '';

  editForm = { requestedAmount: 0, purpose: '' };

  remainingBalance = () => {
    const s = this.schedule();
    if (!s.length) return 0;
    const pending = s.filter(i => i.status !== 'PAID');
    return pending.length ? pending[pending.length - 1].remainingBalance : 0;
  };

  paidCount = () => this.schedule().filter(i => i.status === 'PAID').length;

  ngOnInit() { this.loadApplications(); }

  loadApplications() {
    this.loanService.getLoanApplications().subscribe({
      next: (data) => this.applications.set((data || []).map((a: any) => this.mapApplication(a))),
      error: () => { this.applications.set([]); this.errorMsg = 'Failed to load applications.'; }
    });
  }

  mapApplication(a: any): LoanApplication {
    return {
      id: a.id,
      applicationNumber: a.applicationNumber || `APP-${a.id}`,
      loanProductName:   a.loanProductName || 'Loan',
      requestedAmount:   Number(a.requestedAmount ?? 0),
      interestRate:      Number(a.interestRate ?? 0),
      repaymentPeriodMonths: a.repaymentPeriodMonths || 0,
      status:          a.status || 'DRAFT',
      applicationDate: a.applicationDate || a.createdAt?.split('T')[0] || '',
      purpose:         a.purpose || '',
      readOnly:        a.readOnly ?? false,
      reviewComments:  a.reviewComments,
      approvalComments: a.approvalComments,
      rejectionReason: a.rejectionReason,
      decisionDate:    a.decisionDate
    };
  }

  hasDisbursedStatus(status?: string) {
    return status === 'DISBURSED' || status === 'APPROVED' || status === 'COMPLETED';
  }

  formatStatus(status: string) {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  formatStatusClass(status: string) { return status.toLowerCase().replace(/_/g, ''); }

  canEdit(app: LoanApplication)   { return app.status === 'DRAFT' || app.status === 'NEEDS_MORE_INFORMATION'; }
  canSubmit(app: LoanApplication) { return app.status === 'DRAFT'; }
  canDelete(app: LoanApplication) { return app.status === 'DRAFT'; }

  viewDetails(app: LoanApplication) {
    this.selectedApp.set(app);
    this.editing.set(false);
    this.activeTab = 'details';
    this.schedule.set([]);
    this.successMsg = '';
    this.errorMsg   = '';
    this.loadHistory(app.id);
  }

  startEdit(app: LoanApplication) {
    this.selectedApp.set(app);
    this.editing.set(true);
    this.activeTab = 'details';
    this.editForm.requestedAmount = app.requestedAmount;
    this.editForm.purpose = app.purpose;
    this.loadHistory(app.id);
  }

  closePanel() {
    this.selectedApp.set(null);
    this.editing.set(false);
    this.reviewHistory.set([]);
    this.schedule.set([]);
    this.activeTab = 'details';
  }

  loadHistory(id: number) {
    this.loanService.getApplicationHistory(id).subscribe({
      next: (data) => {
        if (data?.application) this.selectedApp.set(this.mapApplication(data.application));
        this.reviewHistory.set((data?.reviews || []).map((r: any) => ({
          id: r.id, decision: r.decision, comments: r.comments,
          reviewStage: r.reviewStage, reviewerName: r.reviewerName, reviewDate: r.reviewDate
        })));
      },
      error: (err) => console.error('Error loading history:', err)
    });
  }

  loadSchedule(appId: number) {
    if (this.scheduleLoading) return;
    this.scheduleLoading = true;
    this.loanService.getRepaymentSchedule(appId).subscribe({
      next: (data) => {
        this.schedule.set((data || []).map((s: any) => ({
          id: s.id,
          installmentNumber: s.installmentNumber,
          dueDate:           s.dueDate,
          principalAmount:   Number(s.principalAmount ?? 0),
          interestAmount:    Number(s.interestAmount  ?? 0),
          totalPayment:      Number(s.totalPayment    ?? 0),
          remainingBalance:  Number(s.remainingBalance ?? 0),
          status:    s.status || 'PENDING',
          paidDate:  s.paidDate
        })));
        this.scheduleLoading = false;
      },
      error: () => { this.scheduleLoading = false; }
    });
  }

  saveEdit() {
    const app = this.selectedApp();
    if (!app) return;
    this.loading = true;
    this.errorMsg = '';
    this.loanService.updateApplication(app.id, {
      requestedAmount: this.editForm.requestedAmount,
      purpose: this.editForm.purpose
    }).subscribe({
      next: (updated) => {
        this.loading = false;
        this.editing.set(false);
        this.successMsg = 'Application updated successfully.';
        this.loadApplications();
        this.selectedApp.set(this.mapApplication(updated));
        this.loadHistory(app.id);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to update application.';
      }
    });
  }

  submitApp(app: LoanApplication) {
    this.loading = true;
    this.errorMsg = '';
    this.loanService.submitApplication(app.id).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Application submitted successfully!';
        this.closePanel();
        this.loadApplications();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to submit application.';
      }
    });
  }

  deleteApp(app: LoanApplication) {
    if (!confirm('Delete this draft application?')) return;
    this.loanService.deleteLoanApplication(app.id).subscribe({
      next: () => {
        this.successMsg = 'Draft application deleted.';
        this.closePanel();
        this.loadApplications();
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed to delete application.'; }
    });
  }
}
