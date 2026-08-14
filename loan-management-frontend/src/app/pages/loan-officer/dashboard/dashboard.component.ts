import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardCardComponent } from '../../../components/dashboard-card/dashboard-card.component';
import { DashboardService } from '../../../core/services/dashboard.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import { registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-loan-officer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardCardComponent, BaseChartDirective],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div>
          <h1>Loan Officer Dashboard</h1>
          <p>Analyze queues, recommend loan applications, and keep track of repayments.</p>
        </div>
      </div>

      <div class="dashboard-content">
        <!-- Live statistics grid -->
        <div class="stats-grid">
          <app-dashboard-card
            title="Assigned Applications"
            [value]="stats()?.totalAssignedApplications ?? 0"
            icon="📋"
            trend="Total assigned"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Awaiting Review"
            [value]="stats()?.awaitingReview ?? 0"
            icon="⏳"
            trend="Needs immediate review"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Under Active Review"
            [value]="stats()?.underReview ?? 0"
            icon="🔍"
            trend="Currently auditing"
          ></app-dashboard-card>
          <app-dashboard-card
            title="Overdue Repayments"
            [value]="stats()?.overdueRepayments ?? 0"
            icon="🚨"
            trend="System wide alerts"
          ></app-dashboard-card>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
          <!-- Recommended Approvals -->
          <div class="status-item" style="background: white; padding: 20px; border-left: 3px solid var(--success); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="font-weight: 600; opacity: 0.7; font-size: 13px; text-transform: uppercase;">Recommended Approvals</p>
            <h3 style="font-size: 28px; color: var(--success); margin: 8px 0;">{{ stats()?.recommendedApprovals ?? 0 }}</h3>
          </div>

          <!-- Recommended Rejections -->
          <div class="status-item" style="background: white; padding: 20px; border-left: 3px solid var(--danger); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="font-weight: 600; opacity: 0.7; font-size: 13px; text-transform: uppercase;">Recommended Rejections</p>
            <h3 style="font-size: 28px; color: var(--danger); margin: 8px 0;">{{ stats()?.recommendedRejections ?? 0 }}</h3>
          </div>

          <!-- Today's reviews completed -->
          <div class="status-item" style="background: white; padding: 20px; border-left: 3px solid var(--info); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="font-weight: 600; opacity: 0.7; font-size: 13px; text-transform: uppercase;">Today's Completed Reviews</p>
            <h3 style="font-size: 28px; color: var(--info); margin: 8px 0;">{{ stats()?.todayReviews ?? 0 }}</h3>
          </div>
        </div>

        <!-- Charts row -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          <!-- Applications by Status (Doughnut Chart) -->
          <div class="dashboard-section" style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div class="section-header">
              <h2>Applications Status Distribution</h2>
            </div>
            <div style="display: block; position: relative; height: 260px; width: 100%; display: flex; justify-content: center;">
              <canvas baseChart 
                [data]="statusChartData" 
                [options]="chartOptions" 
                [type]="'doughnut'">
              </canvas>
            </div>
          </div>

          <!-- Applications by Month (Bar Chart) -->
          <div class="dashboard-section" style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div class="section-header">
              <h2>Applications Volume by Month</h2>
            </div>
            <div style="display: block; position: relative; height: 260px; width: 100%;">
              <canvas baseChart 
                [data]="monthChartData" 
                [options]="chartOptions" 
                [type]="'bar'">
              </canvas>
            </div>
          </div>

          <!-- Review Performance (Line Chart) -->
          <div class="dashboard-section" style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div class="section-header">
              <h2>My Audit Productivity (Reviews by Month)</h2>
            </div>
            <div style="display: block; position: relative; height: 260px; width: 100%;">
              <canvas baseChart 
                [data]="perfChartData" 
                [options]="chartOptions" 
                [type]="'line'">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Recent Applications queue -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>Recent Assigned Applications</h2>
            <a routerLink="/loan-officer/review" style="font-size: 13px; font-weight: 600; color: var(--primary-teal);">View Review Queue →</a>
          </div>
          <div class="applications-list">
            <div *ngFor="let app of stats()?.recentApplications" class="app-item">
              <div class="app-info">
                <h3>{{ app.customerName || 'Business Owner' }} - {{ app.loanProductName }}</h3>
                <p>Requested: <strong>\${{ app.requestedAmount | number:'1.2-2' }}</strong> | Date: {{ app.applicationDate }}</p>
              </div>
              <span class="status-badge" [ngClass]="app.status.toLowerCase().replace('_', '')">
                {{ app.status.replace('_', ' ') }}
              </span>
            </div>
            <div *ngIf="!(stats()?.recentApplications?.length)" style="text-align: center; padding: 30px; opacity: 0.6;">
              <p>No recent applications assigned.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoanOfficerDashboardComponent implements OnInit {
  dashboardService = inject(DashboardService);
  stats = signal<any>(null);

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  // Status Distribution Chart (Doughnut)
  statusChartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  // Applications Volume Chart (Bar)
  monthChartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  // Performance Chart (Line)
  perfChartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.dashboardService.getLoanOfficerDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.updateCharts(data);
      },
      error: (err) => {
        console.error('Error loading dashboard statistics:', err);
      }
    });
  }

  updateCharts(data: any) {
    if (!data) return;

    // 1. Status Chart
    if (data.statusDistribution) {
      const labels = Object.keys(data.statusDistribution);
      const values = Object.values(data.statusDistribution) as number[];
      this.statusChartData = {
        labels: labels.map(l => l.replace('_', ' ')),
        datasets: [{
          data: values,
          backgroundColor: ['#312E81', '#00AFA9', '#f39c12', '#e74c3c', '#27ae60', '#3498db']
        }]
      };
    }

    // 2. Volume Chart
    if (data.applicationsByMonth) {
      const labels = Object.keys(data.applicationsByMonth);
      const values = Object.values(data.applicationsByMonth) as number[];
      this.monthChartData = {
        labels: labels,
        datasets: [{
          data: values,
          label: 'Applications',
          backgroundColor: '#312E81'
        }]
      };
    }

    // 3. Performance Chart
    if (data.reviewPerformance) {
      const labels = Object.keys(data.reviewPerformance);
      const values = Object.values(data.reviewPerformance) as number[];
      this.perfChartData = {
        labels: labels,
        datasets: [{
          data: values,
          label: 'Reviews Conducted',
          borderColor: '#00AFA9',
          backgroundColor: 'rgba(0, 175, 169, 0.1)',
          fill: true,
          tension: 0.3
        }]
      };
    }
  }
}
