import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardCardComponent } from '../../../components/dashboard-card/dashboard-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LoanService } from '../../../core/services/loan.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType, ChartOptions, Chart } from 'chart.js';
import { registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardCardComponent, BaseChartDirective],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div>
          <h1>Welcome Back, {{ currentUser()?.fullName || 'Valued Customer' }}!</h1>
          <p>Here's a live overview of your loan accounts and repayment status.</p>
        </div>
      </div>

      <div class="dashboard-content">
        <!-- Statistics grid -->
        <div class="stats-grid">
          <app-dashboard-card
            title="Total Applications"
            [value]="stats()?.totalApplications ?? 0"
            icon="📋"
            trend="Submitted applications"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Approved Loans"
            [value]="stats()?.approvedLoans ?? 0"
            icon="✅"
            trend="Approved to date"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Pending Reviews"
            [value]="stats()?.pendingLoans ?? 0"
            icon="⏳"
            trend="Awaiting review"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Active Loans"
            [value]="stats()?.activeLoans ?? 0"
            icon="⚡"
            trend="Active accounts"
          ></app-dashboard-card>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
          <!-- Remaining Balance Card -->
          <div class="status-item" style="background: white; padding: 24px; border-left: 4px solid var(--primary-teal); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="font-weight: 600; opacity: 0.7; font-size: 14px; text-transform: uppercase;">Total Remaining Balance</p>
            <div style="display: flex; align-items: center; gap: 10px; margin: 12px 0;">
              <h2 style="font-size: 32px; color: var(--primary-purple); margin: 0;">
                @if (balanceVisible()) {
                  {{ (stats()?.remainingBalance ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }} ETB
                } @else {
                  •••••••••••• ETB
                }
              </h2>
              <button (click)="toggleBalance()" 
                      style="background: none; border: none; cursor: pointer; font-size: 20px; padding: 5px; opacity: 0.7;"
                      [attr.aria-label]="balanceVisible() ? 'Hide balance' : 'Show balance'"
                      title="Toggle balance visibility">
                @if (balanceVisible()) {
                  👁
                } @else {
                  👁‍🗨
                }
              </button>
            </div>
            <p style="font-size: 12px; opacity: 0.6;">All active loan outstanding balances</p>
          </div>

          <!-- Next Repayment Card -->
          <div class="status-item" style="background: white; padding: 24px; border-left: 4px solid var(--warning); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="font-weight: 600; opacity: 0.7; font-size: 14px; text-transform: uppercase;">Next Due Repayment</p>
            <h2 style="font-size: 32px; color: var(--warning); margin: 12px 0;">
              {{ (stats()?.nextRepaymentAmount ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }} ETB
            </h2>
            <p style="font-size: 13px; font-weight: 500;">
              Due Date: <span style="color: var(--text-dark);">{{ stats()?.nextRepaymentDate ? stats()?.nextRepaymentDate : 'No pending payments' }}</span>
            </p>
          </div>

          <!-- Repayment Progress Card -->
          <div class="status-item" style="background: white; padding: 24px; border-left: 4px solid var(--success); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="font-weight: 600; opacity: 0.7; font-size: 14px; text-transform: uppercase;">Total Repayment Progress</p>
            <h2 style="font-size: 32px; color: var(--success); margin: 12px 0;">
              {{ (stats()?.repaymentProgress ?? 0) | number:'1.1-2' }}%
            </h2>
            <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden; margin-top: 8px;">
              <div [style.width.%]="stats()?.repaymentProgress ?? 0"
                   style="background: var(--success); height: 100%; transition: width 0.5s ease-in-out;"></div>
            </div>
          </div>
        </div>

        <!-- 2-Column Grid: Pie Chart & Recent Notifications -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          <!-- Pie Chart — Loan Applications Status -->
          <div class="dashboard-section"
               style="background: white; padding: 24px; border-radius: 8px;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border-color);
                      display: flex; flex-direction: column;">
            <div class="section-header" style="margin-bottom: 16px;">
              <h2>Loan Applications Status</h2>
            </div>
            <div style="position: relative; height: 210px; width: 100%;
                        display: flex; justify-content: center; align-items: center;">
              <canvas baseChart
                [data]="pieChartData"
                [options]="pieChartOptions"
                [type]="pieChartType">
              </canvas>
            </div>
          </div>

          <!-- Recent Notifications -->
          <div class="dashboard-section"
               style="background: white; padding: 24px; border-radius: 8px;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border-color);
                      display: flex; flex-direction: column;">
            <div class="section-header" style="margin-bottom: 16px;">
              <h2>Recent Notifications</h2>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;
                        overflow-y: auto; max-height: 210px;">
              <div *ngFor="let notification of stats()?.recentNotifications"
                   style="padding: 10px 12px; background: var(--light-bg); border-radius: 6px;
                          border-left: 3px solid var(--primary-teal);">
                <p style="font-weight: 600; font-size: 13px; color: var(--primary-purple); margin: 0 0 4px 0;">
                  {{ notification.title }}
                </p>
                <p style="margin: 0; font-size: 12px; opacity: 0.8; line-height: 1.4;">
                  {{ notification.message }}
                </p>
              </div>
              <div *ngIf="!(stats()?.recentNotifications?.length)"
                   style="text-align: center; padding: 20px; opacity: 0.6;">
                <p>No recent alerts.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Latest Application Status Section -->
        <div class="dashboard-section"
             style="background: white; padding: 24px; border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 10px;">
          <div class="section-header" style="margin-bottom: 20px;">
            <h2>My Active &amp; Recent Loan Applications</h2>
          </div>
          <div *ngIf="applications().length > 0" style="display: flex; flex-direction: column; gap: 16px;">
            <div *ngFor="let app of applications()"
                 style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #fafafa;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;
                          flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #edf2f7;
                          padding-bottom: 12px; margin-bottom: 12px;">
                <div>
                  <h3 style="margin: 0; font-size: 16px; color: var(--primary-purple);">
                    {{ app.loanProductName }} — {{ app.applicationNumber || ('APP-' + app.id) }}
                  </h3>
                  <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.7;">
                    Applied on: {{ app.applicationDate || app.createdAt?.split('T')[0] }}
                  </p>
                </div>
                <span class="status-badge" [ngClass]="app.status?.toLowerCase()?.replace('_', '')">
                  {{ app.status?.replace('_', ' ') }}
                </span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                          gap: 15px; font-size: 14px; margin-bottom: 12px;">
                <div>
                  <p style="margin: 0 0 4px 0; opacity: 0.7;">Requested Amount</p>
                  <p style="margin: 0; font-weight: 600; font-size: 16px; color: var(--text-dark);">
                    {{ app.requestedAmount?.toLocaleString() }} ETB
                  </p>
                </div>
                <div *ngIf="app.status === 'APPROVED'">
                  <p style="margin: 0 0 4px 0; opacity: 0.7;">Interest Rate</p>
                  <p style="margin: 0; font-weight: 600; font-size: 16px; color: var(--success);">
                    {{ app.interestRate }}%
                  </p>
                </div>
                <div *ngIf="app.status === 'APPROVED'">
                  <p style="margin: 0 0 4px 0; opacity: 0.7;">Repayment Term</p>
                  <p style="margin: 0; font-weight: 600; font-size: 16px; color: var(--text-dark);">
                    {{ app.repaymentPeriodMonths }} Months
                  </p>
                </div>
              </div>

              <!-- Manager Decision & Comments -->
              <div *ngIf="app.approvalComments || app.reviewComments || app.rejectionReason"
                   style="background: #edf2f7; padding: 12px 15px; border-radius: 6px;
                          font-size: 13.5px; border-left: 4px solid var(--primary-teal);">
                <div *ngIf="app.decisionDate">
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: var(--primary-purple);">Decision Date:</p>
                  <p style="margin: 0 0 8px 0;">{{ app.decisionDate | date:'medium' }}</p>
                </div>
                <div *ngIf="app.rejectionReason && app.status === 'REJECTED'">
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: var(--danger);">Rejection Reason:</p>
                  <p style="margin: 0 0 8px 0; font-style: italic; line-height: 1.4;">"{{ app.rejectionReason }}"</p>
                </div>
                <div *ngIf="app.approvalComments">
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: var(--primary-purple);">Manager Decision Comments:</p>
                  <p style="margin: 0 0 8px 0; font-style: italic; line-height: 1.4;">"{{ app.approvalComments }}"</p>
                </div>
                <div *ngIf="!app.approvalComments && app.reviewComments">
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: var(--primary-purple);">Officer Review Remarks:</p>
                  <p style="margin: 0; font-style: italic; line-height: 1.4;">"{{ app.reviewComments }}"</p>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="applications().length === 0"
               style="text-align: center; padding: 30px; opacity: 0.6;">
            <p>You have not submitted any loan applications yet.</p>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class CustomerDashboardComponent implements OnInit {
  authService      = inject(AuthService);
  dashboardService = inject(DashboardService);
  loanService      = inject(LoanService);

  currentUser  = this.authService.currentUser;
  stats        = signal<any>(null);
  applications = signal<any[]>([]);

  // Balance visibility toggle
  balanceVisible = signal(true);
  toggleBalance() {
    this.balanceVisible.update(v => !v);
  }

  // ── Pie chart — Loan Applications Status ──────────────────────────
  pieChartType = 'pie' as const;
  pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels:   [],
    datasets: [{ data: [] }]
  };
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11.5 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            return ` ${label}`;
          }
        }
      }
    }
  };

  ngOnInit() {
    this.loadStats();
    this.loadApplications();
  }

  loadApplications() {
    this.loanService.getLoanApplications().subscribe({
      next:  (data) => this.applications.set(data || []),
      error: (err)  => console.error('Error loading applications:', err)
    });
  }

  loadStats() {
    this.dashboardService.getCustomerDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.updatePieChart(data);
      },
      error: (err) => console.error('Error loading dashboard statistics:', err)
    });
  }

  private updatePieChart(data: any) {
    if (!data?.statusDistribution) return;
    const rawLabels = Object.keys(data.statusDistribution);
    const values = Object.values(data.statusDistribution) as number[];
    const total = values.reduce((a, b) => a + b, 0);

    const labelsWithStats = rawLabels.map((l, index) => {
      const formattedName = l.replace(/_/g, ' ');
      const val = values[index];
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
      return `${formattedName}: ${val} (${pct}%)`;
    });

    this.pieChartData = {
      labels: labelsWithStats,
      datasets: [{
        data:            values,
        backgroundColor: ['#312E81', '#00AFA9', '#f39c12', '#e74c3c', '#27ae60', '#3498db']
      }]
    };
  }
}

