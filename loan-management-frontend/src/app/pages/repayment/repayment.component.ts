import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepaymentService, RepaymentResponse } from '../../core/services/repayment.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { TransactionService } from '../../core/services/transaction.service';
import { BackButtonComponent } from '../../components/back-button/back-button.component';

// ── Mock types for the Loan Officer view ─────────────────────────────────────
interface MockCustomerRepayment {
  customerName:    string;
  accountNumber:   string;
  loanType:        string;
  loanAppNumber:   string;
  totalAmount:     number;
  amountPaid:      number;
  remainingBalance: number;
  progress:        number;
  nextPaymentDate: string;
  nextPaymentAmt:  number;
  paymentStatus:   'PENDING' | 'PAID' | 'OVERDUE';
}

interface MockTransaction {
  date:        string;
  refNumber:   string;
  description: string;
  amount:      number;
  type:        'PAYMENT' | 'REPAYMENT' | 'DISBURSEMENT';
  status:      'COMPLETED' | 'PENDING' | 'FAILED';
}

@Component({
  selector: 'app-repayment',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `

    <!-- ══════════════════════════════════════════════════════════════════════
         LOAN OFFICER VIEW — read-only dashboard of customer repayments
         ══════════════════════════════════════════════════════════════════════ -->
    <ng-container *ngIf="role() === 'LOAN_OFFICER'">
      <div class="page-wrapper">
        <app-back-button></app-back-button>

        <div class="page-header">
          <div>
            <h1>Repayment Overview</h1>
            <p>View customer loan repayment schedules and transaction history</p>
          </div>
          <span style="padding:6px 14px;background:rgba(0,175,169,.1);
                        color:var(--primary-teal);border-radius:6px;
                        font-size:13px;font-weight:600;">Read-Only View</span>
        </div>

        <div class="page-content">

          <!-- ── Summary cards ──────────────────────────────────────────── -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
                      gap:16px;margin-bottom:28px;">

            <div style="background:white;border-radius:10px;padding:20px;
                        border-left:4px solid var(--success);
                        border:1px solid var(--border-color);border-left-width:4px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.05em;opacity:.6;font-weight:600;">Total Amount Paid</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:var(--success);">
                {{ mockSummary.totalPaid | currency:'ETB':'symbol':'1.2-2' }}
              </p>
            </div>

            <div style="background:white;border-radius:10px;padding:20px;
                        border-left:4px solid var(--danger);
                        border:1px solid var(--border-color);border-left-width:4px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.05em;opacity:.6;font-weight:600;">Outstanding Balance</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:var(--danger);">
                {{ mockSummary.remainingBalance | currency:'ETB':'symbol':'1.2-2' }}
              </p>
            </div>

            <div style="background:white;border-radius:10px;padding:20px;
                        border-left:4px solid var(--warning);
                        border:1px solid var(--border-color);border-left-width:4px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.05em;opacity:.6;font-weight:600;">Overdue Installments</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:var(--warning);">
                {{ mockSummary.overdueInstallments }}
              </p>
            </div>

            <div style="background:white;border-radius:10px;padding:20px;
                        border-left:4px solid var(--primary-purple);
                        border:1px solid var(--border-color);border-left-width:4px;">
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.05em;opacity:.6;font-weight:600;">
                Overall Progress &nbsp;
                <span style="font-size:15px;font-weight:700;opacity:1;
                             color:var(--primary-purple);">
                  {{ mockSummary.progress }}%
                </span>
              </p>
              <div style="background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;">
                <div [style.width.%]="mockSummary.progress"
                     style="background:var(--primary-purple);height:100%;
                            transition:width .5s ease-in-out;border-radius:4px;"></div>
              </div>
            </div>

          </div>

          <!-- ── Customer Repayment Details ─────────────────────────────── -->
          <h2 style="margin:0 0 16px;font-size:16px;color:var(--primary-purple);">
            📋 Customer Repayment Details
          </h2>

          <div style="display:grid;gap:16px;margin-bottom:32px;">
            <div *ngFor="let c of mockCustomers"
                 style="background:white;border-radius:10px;border:1px solid var(--border-color);
                        padding:22px 26px;display:grid;
                        grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px;">

              <!-- Customer info -->
              <div>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;
                           opacity:.55;font-weight:600;letter-spacing:.05em;">Customer</p>
                <p style="margin:0;font-weight:700;font-size:15px;">{{ c.customerName }}</p>
                <p style="margin:2px 0 0;font-size:12px;font-family:monospace;opacity:.7;">
                  {{ c.accountNumber }}
                </p>
              </div>

              <!-- Loan type -->
              <div>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;
                           opacity:.55;font-weight:600;letter-spacing:.05em;">Loan Type</p>
                <p style="margin:0;font-weight:600;font-size:14px;">{{ c.loanType }}</p>
                <p style="margin:2px 0 0;font-size:12px;opacity:.6;font-family:monospace;">
                  {{ c.loanAppNumber }}
                </p>
              </div>

              <!-- Amount paid -->
              <div>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;
                           opacity:.55;font-weight:600;letter-spacing:.05em;">Amount Paid</p>
                <p style="margin:0;font-weight:700;font-size:15px;color:var(--success);">
                  {{ c.amountPaid | currency:'ETB':'symbol':'1.2-2' }}
                </p>
                <p style="margin:2px 0 0;font-size:11px;opacity:.55;">
                  of {{ c.totalAmount | currency:'ETB':'symbol':'1.2-2' }}
                </p>
              </div>

              <!-- Remaining -->
              <div>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;
                           opacity:.55;font-weight:600;letter-spacing:.05em;">Remaining</p>
                <p style="margin:0;font-weight:700;font-size:15px;color:var(--danger);">
                  {{ c.remainingBalance | currency:'ETB':'symbol':'1.2-2' }}
                </p>
              </div>

              <!-- Progress -->
              <div>
                <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;
                           opacity:.55;font-weight:600;letter-spacing:.05em;">
                  Progress &nbsp; <strong style="opacity:1;">{{ c.progress }}%</strong>
                </p>
                <div style="background:#e0e0e0;border-radius:4px;height:7px;overflow:hidden;">
                  <div [style.width.%]="c.progress"
                       style="background:var(--primary-teal);height:100%;border-radius:4px;"></div>
                </div>
              </div>

              <!-- Next payment -->
              <div>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;
                           opacity:.55;font-weight:600;letter-spacing:.05em;">Next Payment</p>
                <p style="margin:0;font-weight:600;font-size:14px;color:var(--primary-teal);">
                  {{ c.nextPaymentAmt | currency:'ETB':'symbol':'1.2-2' }}
                </p>
                <p style="margin:2px 0 0;font-size:12px;opacity:.6;">{{ c.nextPaymentDate }}</p>
              </div>

              <!-- Status -->
              <div style="display:flex;align-items:flex-start;padding-top:18px;">
                <span [style.background]="c.paymentStatus === 'PAID'    ? '#d4edda'
                                        : c.paymentStatus === 'OVERDUE' ? '#f8d7da' : '#fff3cd'"
                      [style.color]="c.paymentStatus === 'PAID'    ? '#155724'
                                   : c.paymentStatus === 'OVERDUE' ? '#721c24' : '#856404'"
                      style="padding:5px 14px;border-radius:14px;font-size:12px;font-weight:700;">
                  {{ c.paymentStatus }}
                </span>
              </div>

            </div>
          </div>

          <!-- ── Transaction Details ──────────────────────────────────────── -->
          <div style="display:flex;justify-content:space-between;align-items:center;
                      margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <h2 style="margin:0;font-size:16px;color:var(--primary-purple);">
              💳 Transaction Details
            </h2>
            <input type="text" [(ngModel)]="txSearch"
                   placeholder="Search transactions…"
                   style="padding:8px 12px;border:1px solid var(--border-color);
                          border-radius:6px;font-size:13px;min-width:220px;" />
          </div>

          <div class="table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference #</th>
                    <th>Description</th>
                    <th style="text-align:right;">Amount (ETB)</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of filteredMockTransactions"
                      style="border-bottom:1px solid var(--border-color);">
                    <td style="white-space:nowrap;font-size:13px;">{{ tx.date }}</td>
                    <td style="font-family:monospace;font-size:13px;color:var(--primary-purple);">
                      {{ tx.refNumber }}
                    </td>
                    <td style="font-size:13px;max-width:240px;overflow:hidden;
                               text-overflow:ellipsis;white-space:nowrap;"
                        [title]="tx.description">{{ tx.description }}</td>
                    <td style="text-align:right;font-weight:700;"
                        [style.color]="tx.type === 'DISBURSEMENT'
                                      ? 'var(--danger)' : 'var(--success)'">
                      {{ tx.type === 'DISBURSEMENT' ? '−' : '+' }}
                      {{ tx.amount | currency:'ETB':'symbol':'1.2-2' }}
                    </td>
                    <td>
                      <span class="status-badge"
                            [ngClass]="tx.type === 'DISBURSEMENT' ? 'rejected'
                                     : tx.type === 'REPAYMENT'    ? 'active'
                                     : 'underreview'">
                        {{ tx.type }}
                      </span>
                    </td>
                    <td>
                      <span [style.background]="tx.status === 'COMPLETED' ? '#d4edda'
                                              : tx.status === 'PENDING'   ? '#fff3cd' : '#f8d7da'"
                            [style.color]="tx.status === 'COMPLETED' ? '#155724'
                                         : tx.status === 'PENDING'   ? '#856404' : '#721c24'"
                            style="padding:3px 10px;border-radius:12px;
                                   font-size:11px;font-weight:700;">
                        {{ tx.status }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="filteredMockTransactions.length === 0">
                    <td colspan="6" class="empty-state">
                      <p>No transactions match your search.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </ng-container>


    <!-- ══════════════════════════════════════════════════════════════════════
         CUSTOMER / ADMIN / MANAGER VIEW — unchanged original component
         ══════════════════════════════════════════════════════════════════════ -->
    <ng-container *ngIf="role() !== 'LOAN_OFFICER'">
      <div class="notification-page-wrapper"
           style="background-color: var(--light-bg); min-height: 100vh;">
        <app-back-button></app-back-button>
        <div class="notification-page-header">
          <div>
            <h1>Loan Repayments</h1>
            <p>Track, manage, and process simulated payments and schedules</p>
          </div>
        </div>

        <div class="page-content" style="padding: 0 24px 24px;">
          <!-- Stats grid -->
          <div class="repayment-stats-grid">
            <div class="repayment-stats-card">
              <div class="repayment-stats-icon">💰</div>
              <div class="repayment-stats-info">
                <h4>Total Paid</h4>
                <p>{{ stats().totalPaid | currency:'ETB ':'code' }}</p>
              </div>
            </div>
            <div class="repayment-stats-card">
              <div class="repayment-stats-icon">🏦</div>
              <div class="repayment-stats-info">
                <h4>Remaining Balance</h4>
                <p>{{ stats().remainingBalance | currency:'ETB ':'code' }}</p>
              </div>
            </div>
            <div class="repayment-stats-card">
              <div class="repayment-stats-icon"
                   style="color: var(--danger); background: rgba(231, 76, 60, 0.1);">⚠️</div>
              <div class="repayment-stats-info">
                <h4>Overdue Installments</h4>
                <p style="color: var(--danger);">{{ stats().overdueInstallments }}</p>
              </div>
            </div>
            <div class="repayment-stats-card">
              <div class="repayment-stats-icon"
                   style="color: var(--success); background: rgba(39, 174, 96, 0.1);">🏆</div>
              <div class="repayment-stats-info">
                <h4>Completed Loans</h4>
                <p style="color: var(--success);">{{ stats().completedLoans }}</p>
              </div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="repayment-progress-section">
            <div class="repayment-progress-label">
              <h3>Repayment Progress</h3>
              <span>{{ stats().repaymentProgress }}%</span>
            </div>
            <div class="repayment-progress-bar-bg">
              <div class="repayment-progress-bar-fill"
                   [style.width.%]="stats().repaymentProgress"></div>
            </div>
          </div>

          <div *ngIf="successMsg" class="success-message"
               style="margin-bottom:20px;padding:12px;border-radius:6px;
                      background-color:rgba(39,174,96,.1);color:var(--success);font-weight:600;">
            {{ successMsg }}
          </div>
          <div *ngIf="errorMsg" class="error-message"
               style="margin-bottom:20px;padding:12px;border-radius:6px;
                      background-color:rgba(231,76,60,.1);color:var(--danger);font-weight:600;">
            {{ errorMsg }}
          </div>

          <!-- Tabs -->
          <div class="repayment-tabs">
            <button class="repayment-tab-btn"
                    [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">
              All Installments
            </button>
            <button class="repayment-tab-btn"
                    [class.active]="activeTab() === 'pending'" (click)="activeTab.set('pending')">
              Pending / Partial
            </button>
            <button class="repayment-tab-btn"
                    [class.active]="activeTab() === 'overdue'" (click)="activeTab.set('overdue')">
              Overdue
            </button>
            <button class="repayment-tab-btn"
                    [class.active]="activeTab() === 'paid'" (click)="activeTab.set('paid')">
              Paid
            </button>
          </div>

          <!-- Search (non-customer only) -->
          <div class="repayment-filters" *ngIf="role() !== 'CUSTOMER'">
            <input type="text" class="repayment-search-input"
                   [(ngModel)]="searchQuery"
                   placeholder="Search by application number or loan ID..."
                   style="padding: 10px 14px; border: 1px solid var(--border-color);
                          border-radius: 8px; font-size: 14px;">
          </div>

          <!-- Repayment table -->
          <div class="table-card"
               style="background:white;border-radius:12px;
                      box-shadow:0 4px 15px rgba(0,0,0,.03);
                      overflow:hidden;border:1px solid var(--border-color);">
            <div class="table-responsive">
              <table class="data-table" style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background-color:var(--light-bg);
                             border-bottom:1px solid var(--border-color);text-align:left;">
                    <th style="padding:16px 20px;color:var(--primary-purple);font-weight:700;">Loan App</th>
                    <th style="padding:16px;color:var(--primary-purple);font-weight:700;">Inst #</th>
                    <th style="padding:16px;color:var(--primary-purple);font-weight:700;">Amount Due</th>
                    <th style="padding:16px;color:var(--primary-purple);font-weight:700;">Amount Paid</th>
                    <th style="padding:16px;color:var(--primary-purple);font-weight:700;">Remaining</th>
                    <th style="padding:16px;color:var(--primary-purple);font-weight:700;">Due Date</th>
                    <th style="padding:16px;color:var(--primary-purple);font-weight:700;">Status</th>
                    <th style="padding:16px;color:var(--primary-purple);font-weight:700;text-align:center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of filteredRepayments()"
                      style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding:16px 20px;font-weight:600;color:var(--primary-purple);">
                      {{ item.loanApplicationNumber || 'Loan #' + item.loanId }}
                    </td>
                    <td style="padding:16px;">{{ item.installmentNumber }}</td>
                    <td style="padding:16px;font-weight:600;">
                      {{ item.amountDue | currency:'ETB ':'symbol' }}
                    </td>
                    <td style="padding:16px;color:var(--success);">
                      {{ item.amountPaid | currency:'ETB ':'symbol' }}
                    </td>
                    <td style="padding:16px;font-weight:600;color:var(--primary-purple);">
                      {{ item.remainingBalance | currency:'ETB ':'symbol' }}
                    </td>
                    <td style="padding:16px;">{{ item.dueDate }}</td>
                    <td style="padding:16px;">
                      <span class="repayment-status-badge"
                            [ngClass]="item.status.toLowerCase()">{{ item.status }}</span>
                    </td>
                    <td style="padding:16px;text-align:center;">
                      <button *ngIf="role() === 'CUSTOMER' && item.status !== 'PAID'"
                              class="btn btn-primary"
                              style="padding:6px 12px;font-size:13px;"
                              (click)="openPaymentModal(item)">Pay</button>
                      <button *ngIf="role() === 'ADMIN'"
                              class="btn btn-secondary"
                              style="padding:6px 12px;font-size:13px;"
                              (click)="openAdminEditModal(item)">Edit</button>
                      <span *ngIf="item.status === 'PAID' && role() === 'CUSTOMER'"
                            style="color:var(--success);font-weight:600;font-size:13px;
                                   display:inline-flex;align-items:center;gap:4px;">
                        ✅ Paid
                        <button class="mark-all-btn"
                                style="padding:2px 6px;font-size:11px;"
                                (click)="showReceipt(item)">Receipt</button>
                      </span>
                      <span *ngIf="item.status === 'PAID' && role() !== 'CUSTOMER'"
                            style="color:var(--success);font-weight:600;font-size:13px;">Paid</span>
                    </td>
                  </tr>
                  <tr *ngIf="filteredRepayments().length === 0">
                    <td colspan="8"
                        style="padding:40px;text-align:center;color:#94a3b8;">
                      No repayment schedules found matching this selection.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Make Payment Modal -->
      <div class="receipt-dialog-backdrop" *ngIf="paymentModalOpen()">
        <div class="receipt-dialog-container">
          <div class="receipt-dialog-header">
            <h2>Make Simulated Payment</h2>
            <button class="receipt-close-btn" (click)="closePaymentModal()">✕</button>
          </div>
          <div class="receipt-dialog-body">
            <form (ngSubmit)="submitPayment()" class="form-layout"
                  style="display:flex;flex-direction:column;gap:16px;">
              <div style="background-color:var(--light-bg);padding:12px;
                          border-radius:6px;font-size:13.5px;">
                <p style="margin-bottom:6px;"><strong>Loan App:</strong>
                  {{ selectedRepayment()?.loanApplicationNumber }}</p>
                <p style="margin-bottom:6px;"><strong>Installment #:</strong>
                  {{ selectedRepayment()?.installmentNumber }}</p>
                <p style="margin-bottom:6px;"><strong>Remaining:</strong>
                  {{ selectedRepayment()?.remainingBalance | currency:'ETB ' }}</p>
                <p style="margin-bottom:0;"><strong>Due Date:</strong>
                  {{ selectedRepayment()?.dueDate }}</p>
              </div>
              <div class="form-group" style="display:flex;flex-direction:column;gap:6px;">
                <label for="amountToPay"
                       style="font-weight:600;font-size:13px;color:var(--primary-purple);">
                  Payment Amount (ETB) *
                </label>
                <input type="number" id="amountToPay" [(ngModel)]="paymentForm.amount"
                       name="amountToPay" required
                       [max]="selectedRepayment()?.remainingBalance || 0" min="1"
                       style="padding:10px;border:1px solid var(--border-color);border-radius:6px;">
              </div>
              <div class="form-group" style="display:flex;flex-direction:column;gap:6px;">
                <label for="payMethod"
                       style="font-weight:600;font-size:13px;color:var(--primary-purple);">
                  Payment Method *
                </label>
                <select id="payMethod" [(ngModel)]="paymentForm.paymentMethod"
                        name="payMethod" required
                        style="padding:10px;border:1px solid var(--border-color);border-radius:6px;">
                  <option value="ONLINE_PAYMENT">Online Payment / Mobile App</option>
                  <option value="BANK_TRANSFER">Bank Transfer / CBE Birr</option>
                  <option value="MOBILE_MONEY">Telebirr / Mobile Wallet</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="CHECK">Check Payment</option>
                </select>
              </div>
              <div class="form-group" style="display:flex;flex-direction:column;gap:6px;">
                <label for="payRemarks"
                       style="font-weight:600;font-size:13px;color:var(--primary-purple);">
                  Remarks / Ref Number
                </label>
                <input type="text" id="payRemarks" [(ngModel)]="paymentForm.remarks"
                       name="payRemarks" placeholder="Enter transaction reference..."
                       style="padding:10px;border:1px solid var(--border-color);border-radius:6px;">
              </div>
              <button type="submit" class="btn btn-primary"
                      [disabled]="submittingPayment || !paymentForm.amount"
                      style="width:100%;padding:12px;font-weight:700;margin-top:10px;">
                {{ submittingPayment ? 'Processing...' : 'Confirm Payment' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Admin Edit Modal -->
      <div class="receipt-dialog-backdrop" *ngIf="adminModalOpen()">
        <div class="receipt-dialog-container">
          <div class="receipt-dialog-header">
            <h2>Modify Repayment Record</h2>
            <button class="receipt-close-btn" (click)="closeAdminModal()">✕</button>
          </div>
          <div class="receipt-dialog-body">
            <form (ngSubmit)="submitAdminEdit()" class="form-layout"
                  style="display:flex;flex-direction:column;gap:16px;">
              <div class="form-group" style="display:flex;flex-direction:column;gap:6px;">
                <label for="adminAmount"
                       style="font-weight:600;font-size:13px;color:var(--primary-purple);">
                  Installment Amount Due (ETB) *
                </label>
                <input type="number" id="adminAmount" [(ngModel)]="adminForm.amount"
                       name="adminAmount" required min="1"
                       style="padding:10px;border:1px solid var(--border-color);border-radius:6px;">
              </div>
              <div class="form-group" style="display:flex;flex-direction:column;gap:6px;">
                <label for="adminRemarks"
                       style="font-weight:600;font-size:13px;color:var(--primary-purple);">
                  Remarks / Admin Notes
                </label>
                <input type="text" id="adminRemarks" [(ngModel)]="adminForm.remarks"
                       name="adminRemarks" placeholder="Enter manual modification reason..."
                       style="padding:10px;border:1px solid var(--border-color);border-radius:6px;">
              </div>
              <button type="submit" class="btn btn-primary"
                      [disabled]="submittingAdmin"
                      style="width:100%;padding:12px;font-weight:700;margin-top:10px;">
                {{ submittingAdmin ? 'Saving changes...' : 'Save Manual Changes' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Receipt Modal -->
      <div class="receipt-dialog-backdrop" *ngIf="receiptModalOpen()">
        <div class="receipt-dialog-container">
          <div class="receipt-dialog-header">
            <h2>Payment Receipt</h2>
            <button class="receipt-close-btn" (click)="receiptModalOpen.set(false)">✕</button>
          </div>
          <div class="receipt-dialog-body">
            <div class="repayment-receipt-box">
              <div class="receipt-logo">HIBRET SMART LOAN SYSTEM</div>
              <div style="text-align:center;font-size:12px;color:#64748b;margin-bottom:12px;">
                Official Payment Confirmation
              </div>
              <div class="receipt-divider"></div>
              <div class="receipt-row">
                <span>Receipt Date:</span><span>{{ selectedReceipt()?.paymentDate }}</span>
              </div>
              <div class="receipt-row">
                <span>Loan Account:</span>
                <span>{{ selectedReceipt()?.loanApplicationNumber }}</span>
              </div>
              <div class="receipt-row">
                <span>Installment:</span><span>#{{ selectedReceipt()?.installmentNumber }}</span>
              </div>
              <div class="receipt-divider"></div>
              <div class="receipt-row total">
                <span>Amount Paid:</span>
                <span>{{ selectedReceipt()?.amountPaid | currency:'ETB ' }}</span>
              </div>
              <div class="receipt-row">
                <span>Remaining Balance:</span>
                <span>{{ selectedReceipt()?.remainingBalance | currency:'ETB ' }}</span>
              </div>
              <div class="receipt-divider"></div>
              <div style="text-align:center;font-size:11px;color:#94a3b8;margin-top:15px;">
                Thank you for banking with Hibret Bank.
              </div>
            </div>
            <div style="display:flex;gap:12px;">
              <button class="btn btn-secondary" style="flex:1;" (click)="printReceipt()">
                Print Receipt
              </button>
              <button class="btn btn-primary" style="flex:1;"
                      (click)="receiptModalOpen.set(false)">Close</button>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `
})
export class RepaymentComponent implements OnInit {
  repaymentService   = inject(RepaymentService);
  authService        = inject(AuthService);
  dashboardService   = inject(DashboardService);
  transactionService = inject(TransactionService);

  role = computed(() => this.authService.currentUser()?.role || '');

  // ── LOAN OFFICER mock data ────────────────────────────────────────────────
  readonly mockSummary = {
    totalPaid:            1_042_100.00,
    remainingBalance:     968_450.75,
    overdueInstallments:  3,
    progress:             52
  };

  readonly mockCustomers: MockCustomerRepayment[] = [
    {
      customerName:     'John Doe',
      accountNumber:    '1000000000002',
      loanType:         'Personal Loan',
      loanAppNumber:    'APP-7A3F9C2B',
      totalAmount:      250_000,
      amountPaid:       62_526,
      remainingBalance: 187_474,
      progress:         25,
      nextPaymentDate:  'Sep 1, 2026',
      nextPaymentAmt:   5_210.50,
      paymentStatus:    'PENDING'
    },
    {
      customerName:     'Kalkidan Tesfaye',
      accountNumber:    '1000000000005',
      loanType:         'Business Loan',
      loanAppNumber:    'APP-3C9E5A1D',
      totalAmount:      500_000,
      amountPaid:       375_000,
      remainingBalance: 125_000,
      progress:         75,
      nextPaymentDate:  'Sep 5, 2026',
      nextPaymentAmt:   8_500.00,
      paymentStatus:    'PENDING'
    },
    {
      customerName:     'Singuayi Haile',
      accountNumber:    '1000000000009',
      loanType:         'Home Loan',
      loanAppNumber:    'APP-1B8D4F7C',
      totalAmount:      1_200_000,
      amountPaid:       240_000,
      remainingBalance: 960_000,
      progress:         20,
      nextPaymentDate:  'Aug 20, 2026',
      nextPaymentAmt:   12_000.00,
      paymentStatus:    'OVERDUE'
    }
  ];

  readonly mockTransactions: MockTransaction[] = [
    {
      date: 'Aug 1, 2026',  refNumber: 'TXN-2026080001',
      description: 'Monthly instalment #5 — John Doe / APP-7A3F9C2B',
      amount: 5_210.50, type: 'REPAYMENT', status: 'COMPLETED'
    },
    {
      date: 'Aug 5, 2026',  refNumber: 'TXN-2026080005',
      description: 'Monthly instalment #9 — Kalkidan Tesfaye / APP-3C9E5A1D',
      amount: 8_500.00, type: 'REPAYMENT', status: 'COMPLETED'
    },
    {
      date: 'Jul 20, 2026', refNumber: 'TXN-2026072001',
      description: 'Overdue instalment #3 — Singuayi Haile / APP-1B8D4F7C',
      amount: 12_000.00, type: 'PAYMENT', status: 'PENDING'
    },
    {
      date: 'Jul 1, 2026',  refNumber: 'TXN-2026070101',
      description: 'Monthly instalment #4 — John Doe / APP-7A3F9C2B',
      amount: 5_210.50, type: 'REPAYMENT', status: 'COMPLETED'
    },
    {
      date: 'Jun 15, 2026', refNumber: 'TXN-2026061501',
      description: 'Loan disbursement — Business Loan / APP-3C9E5A1D',
      amount: 500_000.00, type: 'DISBURSEMENT', status: 'COMPLETED'
    },
    {
      date: 'Jun 1, 2026',  refNumber: 'TXN-2026060101',
      description: 'Monthly instalment #3 — John Doe / APP-7A3F9C2B',
      amount: 5_210.50, type: 'REPAYMENT', status: 'COMPLETED'
    },
    {
      date: 'May 10, 2026', refNumber: 'TXN-2026051001',
      description: 'Loan disbursement — Home Loan / APP-1B8D4F7C',
      amount: 1_200_000.00, type: 'DISBURSEMENT', status: 'COMPLETED'
    },
  ];

  txSearch = '';

  get filteredMockTransactions(): MockTransaction[] {
    if (!this.txSearch) return this.mockTransactions;
    const q = this.txSearch.toLowerCase();
    return this.mockTransactions.filter(t =>
      t.refNumber.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    );
  }

  // ── Shared state (CUSTOMER / ADMIN / MANAGER) ─────────────────────────────
  repayments = signal<RepaymentResponse[]>([]);
  stats = signal<any>({
    totalPaid: 0, remainingBalance: 0,
    overdueInstallments: 0, upcomingInstallments: 0,
    completedLoans: 0, repaymentProgress: 0
  });

  activeTab   = signal<string>('all');
  searchQuery = '';
  successMsg  = '';
  errorMsg    = '';

  paymentModalOpen  = signal<boolean>(false);
  adminModalOpen    = signal<boolean>(false);
  receiptModalOpen  = signal<boolean>(false);
  selectedRepayment = signal<RepaymentResponse | null>(null);
  selectedReceipt   = signal<RepaymentResponse | null>(null);

  paymentForm = { amount: 0, paymentMethod: 'ONLINE_PAYMENT', remarks: '' };
  adminForm   = { amount: 0, remarks: '' };

  submittingPayment = false;
  submittingAdmin   = false;

  filteredRepayments = computed(() => {
    let list = this.repayments();
    if (this.searchQuery && this.role() !== 'CUSTOMER') {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r =>
        r.loanApplicationNumber.toLowerCase().includes(q) ||
        r.loanId.toString().includes(q)
      );
    }
    const tab = this.activeTab();
    if (tab === 'pending') list = list.filter(r => r.status === 'PENDING' || r.status === 'PARTIAL');
    if (tab === 'overdue') list = list.filter(r => r.status === 'OVERDUE');
    if (tab === 'paid')    list = list.filter(r => r.status === 'PAID');
    return list;
  });

  ngOnInit() {
    // The LOAN_OFFICER view uses mock data only — no API calls needed
    if (this.role() !== 'LOAN_OFFICER') {
      this.loadData();
    }
  }

  loadData() {
    const fetchObs = this.role() === 'CUSTOMER'
      ? this.repaymentService.getCustomerRepayments()
      : this.repaymentService.getRepayments();

    fetchObs.subscribe({
      next:  (data) => this.repayments.set(data || []),
      error: (err)  => { console.error(err); this.errorMsg = 'Failed to load repayment schedule.'; }
    });

    this.repaymentService.getRepaymentStats().subscribe({
      next:  (res) => this.stats.set(res),
      error: ()    => {}
    });
  }

  openPaymentModal(item: RepaymentResponse) {
    this.selectedRepayment.set(item);
    this.paymentForm = { amount: item.remainingBalance, paymentMethod: 'ONLINE_PAYMENT', remarks: '' };
    this.paymentModalOpen.set(true);
    this.successMsg = ''; this.errorMsg = '';
  }
  closePaymentModal() { this.paymentModalOpen.set(false); this.selectedRepayment.set(null); }

  submitPayment() {
    const item = this.selectedRepayment();
    if (!item) return;
    this.submittingPayment = true;
    this.repaymentService.payRepayment({
      repaymentId: item.id, ...this.paymentForm
    }).subscribe({
      next: (res) => {
        this.submittingPayment = false;
        this.closePaymentModal();
        this.successMsg = 'Repayment recorded successfully.';
        this.loadData();
        this.dashboardService.getBankStats().subscribe({ next: () => {}, error: () => {} });
        this.transactionService.getTransactions().subscribe({ next: () => {}, error: () => {} });
        this.showReceipt(res);
      },
      error: (err) => { this.submittingPayment = false; this.errorMsg = err.error?.message || 'Payment failed.'; }
    });
  }

  openAdminEditModal(item: RepaymentResponse) {
    this.selectedRepayment.set(item);
    this.adminForm = { amount: item.amountDue, remarks: item.remarks || '' };
    this.adminModalOpen.set(true);
    this.successMsg = ''; this.errorMsg = '';
  }
  closeAdminModal() { this.adminModalOpen.set(false); this.selectedRepayment.set(null); }

  submitAdminEdit() {
    const item = this.selectedRepayment();
    if (!item) return;
    this.submittingAdmin = true;
    this.repaymentService.updateRepayment(item.id, this.adminForm).subscribe({
      next: () => {
        this.submittingAdmin = false; this.closeAdminModal();
        this.successMsg = 'Record modified successfully.'; this.loadData();
      },
      error: (err) => { this.submittingAdmin = false; this.errorMsg = err.error?.message || 'Modification failed.'; }
    });
  }

  showReceipt(item: RepaymentResponse) { this.selectedReceipt.set(item); this.receiptModalOpen.set(true); }
  printReceipt() { window.print(); }
}
