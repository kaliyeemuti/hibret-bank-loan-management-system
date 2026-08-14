import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>Financial Reports & Analytics</h1>
          <p>Real-time loan fund balances, disbursements, and repayments</p>
        </div>
      </div>

      <div class="page-content">
        <!-- Quick Stats Cards Grid -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>Financial Overview</h2>
          </div>

          <div *ngIf="loading" class="empty-state">
            <p>Loading reports overview stats...</p>
          </div>

          <div *ngIf="!loading" class="status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
            <div class="status-item" style="background: white; border-radius: 8px; border: 1px solid var(--border-color); padding: 20px;">
              <span class="status-badge approved" style="font-size: 20px; font-weight: 700; display: block; margin-bottom: 8px;">
                {{ stats?.totalBankBalance | currency:'ETB':'symbol':'1.2-2' }}
              </span>
              <p style="margin: 0; font-weight: 600; opacity: 0.7; font-size: 14px;">Total Bank Balance</p>
            </div>

            <div class="status-item" style="background: white; border-radius: 8px; border: 1px solid var(--border-color); padding: 20px;">
              <span class="status-badge submitted" style="font-size: 20px; font-weight: 700; display: block; margin-bottom: 8px; color: var(--info); background-color: rgba(52, 152, 219, 0.2);">
                {{ stats?.totalLoansDisbursed | currency:'ETB':'symbol':'1.2-2' }}
              </span>
              <p style="margin: 0; font-weight: 600; opacity: 0.7; font-size: 14px;">Total Disbursed</p>
            </div>

            <div class="status-item" style="background: white; border-radius: 8px; border: 1px solid var(--border-color); padding: 20px;">
              <span class="status-badge active" style="font-size: 20px; font-weight: 700; display: block; margin-bottom: 8px;">
                {{ stats?.totalLoanRepayments | currency:'ETB':'symbol':'1.2-2' }}
              </span>
              <p style="margin: 0; font-weight: 600; opacity: 0.7; font-size: 14px;">Total Repayments</p>
            </div>

            <div class="status-item" style="background: white; border-radius: 8px; border: 1px solid var(--border-color); padding: 20px;">
              <span class="status-badge rejected" style="font-size: 20px; font-weight: 700; display: block; margin-bottom: 8px;">
                {{ stats?.totalOutstanding | currency:'ETB':'symbol':'1.2-2' }}
              </span>
              <p style="margin: 0; font-weight: 600; opacity: 0.7; font-size: 14px;">Total Outstanding</p>
            </div>
          </div>
        </div>

        <!-- Account Balances by Loan Product -->
        <div class="dashboard-section" style="margin-top: 24px;">
          <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2>Loan Product Dedicated Accounts</h2>
            <a routerLink="/admin/accounts" class="btn-small" style="text-decoration: none;">⚙️ Manage Accounts</a>
          </div>

          <div *ngIf="loading" class="empty-state">
            <p>Loading accounts balance list...</p>
          </div>

          <div *ngIf="!loading" class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Loan Product / Account Type</th>
                  <th style="text-align: right;">Current Balance (ETB)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 600;">Personal Loan</td>
                  <td style="text-align: right; font-weight: 700; color: var(--primary-teal);">
                    {{ (stats?.loanAccountBalances?.PERSONAL_LOAN || 0) | currency:'ETB':'symbol':'1.2-2' }}
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: 600;">Home Loan</td>
                  <td style="text-align: right; font-weight: 700; color: var(--primary-teal);">
                    {{ (stats?.loanAccountBalances?.HOME_LOAN || 0) | currency:'ETB':'symbol':'1.2-2' }}
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: 600;">Business Loan</td>
                  <td style="text-align: right; font-weight: 700; color: var(--primary-teal);">
                    {{ (stats?.loanAccountBalances?.BUSINESS_LOAN || 0) | currency:'ETB':'symbol':'1.2-2' }}
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: 600;">Vehicle Loan</td>
                  <td style="text-align: right; font-weight: 700; color: var(--primary-teal);">
                    {{ (stats?.loanAccountBalances?.VEHICLE_LOAN || 0) | currency:'ETB':'symbol':'1.2-2' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Transactions Quick View -->
        <div class="dashboard-section" style="margin-top: 24px;">
          <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2>Recent Audited Transactions</h2>
            <a routerLink="/admin/transactions" class="btn-small" style="text-decoration: none;">🔍 View All Transactions</a>
          </div>

          <div *ngIf="loading" class="empty-state">
            <p>Loading recent transactions...</p>
          </div>

          <div *ngIf="!loading" class="table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Account</th>
                    <th>Loan App #</th>
                    <th style="text-align: right;">Amount (ETB)</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of stats?.recentTransactions">
                    <td>{{ tx.transactionDate | date:'short' }}</td>
                    <td>
                      <span class="status-badge" [ngClass]="tx.transactionType === 'LOAN_DISBURSEMENT' ? 'rejected' : 'approved'">
                        {{ tx.transactionType }}
                      </span>
                    </td>
                    <td>{{ tx.accountNumber }}</td>
                    <td>{{ tx.loanApplicationNumber || 'N/A' }}</td>
                    <td style="text-align: right; font-weight: 700;" [style.color]="tx.transactionType === 'LOAN_DISBURSEMENT' ? 'var(--danger)' : 'var(--success)'">
                      {{ tx.transactionType === 'LOAN_DISBURSEMENT' ? '-' : '+' }}{{ tx.amount | currency:'ETB':'symbol':'1.2-2' }}
                    </td>
                    <td>{{ tx.description }}</td>
                  </tr>
                  <tr *ngIf="!stats?.recentTransactions?.length">
                    <td colspan="6" class="empty-state">
                      <p>No recent transactions recorded yet.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  dashboardService = inject(DashboardService);
  stats: any = null;
  loading = true;

  ngOnInit() {
    this.fetchReports();
  }

  fetchReports() {
    this.loading = true;
    this.dashboardService.getBankStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching reports statistics:', err);
        this.loading = false;
      }
    });
  }
}
