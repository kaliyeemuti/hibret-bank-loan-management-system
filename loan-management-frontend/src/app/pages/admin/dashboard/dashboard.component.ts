import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardCardComponent } from '../../../components/dashboard-card/dashboard-card.component';
import { LoanService } from '../../../core/services/loan.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardCardComponent],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's your system overview.</p>
        </div>
      </div>

      <div class="dashboard-content">
        <div *ngIf="loading()" class="empty-state"><p>Loading dashboard…</p></div>
        <div *ngIf="errorMsg()" class="error-message" style="margin-bottom:20px;">{{ errorMsg() }}</div>

        <div *ngIf="!loading()" class="stats-grid">
          <app-dashboard-card
            title="Total Users"
            [value]="totalUsers()"
            icon="👥"
            trend="All active users"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Total Customers"
            [value]="totalCustomers()"
            icon="🧑‍💼"
            trend="Active customers"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Total Loan Officers"
            [value]="totalLoanOfficers()"
            icon="📋"
            trend="Processing staff"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Total Managers"
            [value]="totalManagers()"
            icon="👨‍💼"
            trend="Approval authority"
          ></app-dashboard-card>
        </div>

        <div class="dashboard-section">
          <div class="section-header">
            <h2>System Status</h2>
          </div>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-badge success">Active</span>
              <p>Loan Processing System</p>
            </div>
            <div class="status-item">
              <span class="status-badge success">Active</span>
              <p>User Management Module</p>
            </div>
            <div class="status-item">
              <span class="status-badge success">Active</span>
              <p>Reporting Engine</p>
            </div>
            <div class="status-item">
              <span class="status-badge success">Active</span>
              <p>Authentication Service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  loanService = inject(LoanService);

  totalUsers        = signal<number>(0);
  totalCustomers    = signal<number>(0);
  totalLoanOfficers = signal<number>(0);
  totalManagers     = signal<number>(0);
  loading           = signal<boolean>(true);
  errorMsg          = signal<string>('');

  ngOnInit() {
    this.loanService.getUsers().subscribe({
      next: (users) => {
        const list = users || [];
        this.totalUsers.set(list.length);
        this.totalCustomers.set(list.filter((u: any) => u.role === 'CUSTOMER').length);
        this.totalLoanOfficers.set(list.filter((u: any) => u.role === 'LOAN_OFFICER').length);
        this.totalManagers.set(list.filter((u: any) => u.role === 'MANAGER').length);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.errorMsg.set('Failed to load dashboard data. Please refresh.');
        this.loading.set(false);
      }
    });
  }
}
