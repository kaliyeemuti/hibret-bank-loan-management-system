import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DashboardCardComponent } from '../../../components/dashboard-card/dashboard-card.component';
import { LoanService } from '../../../core/services/loan.service';
import { DashboardService } from '../../../core/services/dashboard.service';

interface LoanApplication {
  id: number;
  customerName: string;
  loanType: string;
  amount: number;
  status: string;
  applicationDate: string;
  reviewerName?: string;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardCardComponent],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div>
          <h1>Manager Dashboard</h1>
          <p>Approve and manage loan applications.</p>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="stats-grid">
          <app-dashboard-card
            title="Awaiting Approval"
            [value]="awaitingApprovalCount()"
            icon="⏳"
            trend="Requires action"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Approved Loans"
            [value]="approvedLoansCount()"
            icon="✅"
            trend="Successfully approved"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Rejected Loans"
            [value]="rejectedLoansCount()"
            icon="❌"
            trend="Total rejections"
          ></app-dashboard-card>
        </div>

        <div class="dashboard-section">
          <div class="section-header">
            <h2>Approval Queue</h2>
          </div>
          <div class="applications-list">
            <div *ngFor="let app of queue()" class="app-item">
              <div class="app-info">
                <h3>{{ app.customerName }} - {{ app.loanType }} \${{ app.amount.toLocaleString() }}</h3>
                <p>Reviewed By: {{ app.reviewerName || 'Loan Officer' }} | Date: {{ app.applicationDate }}</p>
              </div>
              <span class="status-badge">Under Review</span>
            </div>
            <div *ngIf="queue().length === 0" class="empty-state">
              <p>No applications awaiting manager approval.</p>
            </div>
          </div>
        </div>

        <div class="dashboard-section">
          <div class="section-header">
            <h2>Performance Metrics</h2>
          </div>
          <div class="metrics-grid">
            <div class="metric-card">
              <h4>Average Approval Time</h4>
              <p class="metric-value">{{ (stats()?.averageApprovalTime ?? 0) | number:'1.1-1' }} days</p>
            </div>
            <div class="metric-card">
              <h4>Approval Rate</h4>
              <p class="metric-value">{{ (stats()?.approvalRate ?? 0) | number:'1.1-1' }}%</p>
            </div>
            <div class="metric-card">
              <h4>Total Applications</h4>
              <p class="metric-value">{{ stats()?.totalApplications ?? 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ManagerDashboardComponent implements OnInit {
  loanService = inject(LoanService);
  dashboardService = inject(DashboardService);

  applications = signal<LoanApplication[]>([]);
  stats = signal<any>(null);

  awaitingApprovalCount = computed(() => this.applications().filter(a => a.status === 'UNDER_REVIEW').length);
  approvedLoansCount = computed(() => this.applications().filter(a => a.status === 'APPROVED').length);
  rejectedLoansCount = computed(() => this.applications().filter(a => a.status === 'REJECTED').length);

  queue = computed(() => this.applications().filter(a => a.status === 'UNDER_REVIEW'));

  ngOnInit() {
    this.loadStats();
    this.loadApplications();
  }

  loadStats() {
    this.dashboardService.getManagerDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (err) => {
        console.error('Error loading manager dashboard stats:', err);
      }
    });
  }

  loadApplications() {
    this.loanService.getLoanApplications().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const mapped = data.map((a: any) => ({
            id: a.id,
            customerName: a.customerName || 'Customer',
            loanType: a.loanProductName || 'Loan',
            amount: a.requestedAmount || 0,
            status: a.status || 'SUBMITTED',
            applicationDate: a.applicationDate || a.createdAt?.split('T')[0] || '',
            reviewerName: a.reviewerName || 'Loan Officer'
          }));
          this.applications.set(mapped);
        } else {
          this.applications.set([]);
        }
      },
      error: (err) => {
        console.error('Error loading applications:', err);
        this.applications.set([]);
      }
    });
  }
}
