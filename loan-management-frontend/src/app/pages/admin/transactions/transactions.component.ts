import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import { RepaymentService, RepaymentResponse } from '../../../core/services/repayment.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { LoanService } from '../../../core/services/loan.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

type ActiveTab = 'transactions' | 'repayments';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>

      <!-- ── Page header ─────────────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <h1>Transactions &amp; Repayments</h1>
          <p>Audit loan disbursements, repayment schedules, and payment history</p>
        </div>
        <button (click)="refresh()"
                style="padding:8px 18px;background:var(--primary-teal);color:white;
                       border:none;border-radius:6px;cursor:pointer;font-size:14px;">
          🔄 Refresh
        </button>
      </div>

      <div class="page-content">

        <!-- ── Summary cards ───────────────────────────────────────────── -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
                    gap:16px;margin-bottom:28px;">

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--primary-teal);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">Total Disbursed</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:var(--danger);">
              {{ totalDisbursed() | currency:'ETB':'symbol':'1.2-2' }}
            </p>
          </div>

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--success);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">Total Repaid</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:var(--success);">
              {{ repaymentStats().totalPaid | currency:'ETB':'symbol':'1.2-2' }}
            </p>
          </div>

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--warning);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">Outstanding Balance</p>
            <p style="margin:0;font-size:22px;font-weight:700;"
               style="color:var(--warning)">
              {{ repaymentStats().remainingBalance | currency:'ETB':'symbol':'1.2-2' }}
            </p>
          </div>

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--danger);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">Overdue Installments</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:var(--danger);">
              {{ repaymentStats().overdueInstallments }}
            </p>
          </div>

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--primary-purple);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">
              Repayment Progress &nbsp;
              <span style="font-size:14px;font-weight:700;opacity:1;
                           color:var(--primary-purple);">
                {{ repaymentStats().repaymentProgress | number:'1.1-1' }}%
              </span>
            </p>
            <div style="background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;">
              <div [style.width.%]="repaymentStats().repaymentProgress"
                   style="background:var(--primary-purple);height:100%;
                          transition:width .5s ease-in-out;border-radius:4px;">
              </div>
            </div>
          </div>

        </div>

        <!-- ── Tab switcher ────────────────────────────────────────────── -->
        <div style="display:flex;gap:0;margin-bottom:20px;
                    border-bottom:2px solid var(--border-color);">
          <button (click)="activeTab.set('transactions')"
                  [style.border-bottom]="activeTab() === 'transactions'
                    ? '3px solid var(--primary-teal)' : 'none'"
                  [style.color]="activeTab() === 'transactions'
                    ? 'var(--primary-teal)' : 'var(--text-dark)'"
                  style="padding:10px 22px;background:none;border:none;cursor:pointer;
                         font-weight:600;font-size:14px;border-bottom-width:3px;">
            💸 Transaction History
          </button>
          <button (click)="activeTab.set('repayments')"
                  [style.border-bottom]="activeTab() === 'repayments'
                    ? '3px solid var(--primary-teal)' : 'none'"
                  [style.color]="activeTab() === 'repayments'
                    ? 'var(--primary-teal)' : 'var(--text-dark)'"
                  style="padding:10px 22px;background:none;border:none;cursor:pointer;
                         font-weight:600;font-size:14px;border-bottom-width:3px;">
            🏦 Repayment Schedules
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════════════════
             TAB: TRANSACTION HISTORY
             ══════════════════════════════════════════════════════════════ -->
        <ng-container *ngIf="activeTab() === 'transactions'">

          <div class="table-card" style="padding:18px 20px;margin-bottom:20px;">
            <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;">
              <div style="flex:1;min-width:220px;">
                <label style="font-size:12px;font-weight:600;display:block;
                               margin-bottom:4px;opacity:.75;">Search</label>
                <input type="text"
                       [(ngModel)]="txSearch"
                       (ngModelChange)="applyTxFilters()"
                       placeholder="Ref, account, description, loan…"
                       style="width:100%;padding:9px 12px;border:1px solid var(--border-color);
                              border-radius:6px;font-size:14px;" />
              </div>

              <div style="flex:1;min-width:180px;">
                <label style="font-size:12px;font-weight:600;display:block;
                               margin-bottom:4px;opacity:.75;">Customer Name</label>
                <input type="text"
                       [(ngModel)]="txCustomer"
                       (ngModelChange)="applyTxFilters()"
                       placeholder="Customer name…"
                       style="width:100%;padding:9px 12px;border:1px solid var(--border-color);
                              border-radius:6px;font-size:14px;" />
              </div>

              <div style="flex:1;min-width:160px;">
                <label style="font-size:12px;font-weight:600;display:block;
                               margin-bottom:4px;opacity:.75;">Account Number</label>
                <input type="text"
                       [(ngModel)]="txAccount"
                       (ngModelChange)="applyTxFilters()"
                       placeholder="Account no…"
                       style="width:100%;padding:9px 12px;border:1px solid var(--border-color);
                              border-radius:6px;font-size:14px;" />
              </div>

              <div>
                <label style="font-size:12px;font-weight:600;display:block;
                               margin-bottom:4px;opacity:.75;">Type</label>
                <select [(ngModel)]="txType" (change)="applyTxFilters()"
                        style="padding:9px 12px;border:1px solid var(--border-color);
                               border-radius:6px;background:white;min-width:170px;">
                  <option value="ALL">All Types</option>
                  <option value="LOAN_DISBURSEMENT">Disbursement</option>
                  <option value="LOAN_REPAYMENT">Repayment</option>
                  <option value="ACCOUNT_ADJUSTMENT">Adjustment</option>
                </select>
              </div>

              <div>
                <label style="font-size:12px;font-weight:600;display:block;
                               margin-bottom:4px;opacity:.75;">From</label>
                <input type="date" [(ngModel)]="txStart" (change)="applyTxFilters()"
                       style="padding:9px;border:1px solid var(--border-color);
                              border-radius:6px;background:white;" />
              </div>

              <div>
                <label style="font-size:12px;font-weight:600;display:block;
                               margin-bottom:4px;opacity:.75;">To</label>
                <input type="date" [(ngModel)]="txEnd" (change)="applyTxFilters()"
                       style="padding:9px;border:1px solid var(--border-color);
                              border-radius:6px;background:white;" />
              </div>

              <button (click)="resetTxFilters()"
                      style="padding:9px 14px;border:1px solid var(--border-color);
                             border-radius:6px;cursor:pointer;background:white;">
                Reset
              </button>
            </div>
          </div>

          <!-- Transaction table -->
          <div class="table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Debit (From)</th>
                    <th>Credit (To)</th>
                    <th style="text-align:right;">Amount (ETB)</th>
                    <th>Description</th>
                    <th>Loan / App</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of filteredTransactions">
                    <td style="white-space:nowrap;font-size:13px;">
                      {{ tx.transactionDate | date:'medium' }}
                    </td>
                    <td>
                      <code style="font-size:12px;background:#f4f4f4;padding:2px 6px;border-radius:4px;">
                        {{ tx.transactionRef || ('TXN-' + tx.id) }}
                      </code>
                    </td>
                    <td>
                      <span class="status-badge"
                            [ngClass]="tx.transactionType === 'LOAN_DISBURSEMENT' ? 'rejected'
                                     : tx.transactionType === 'LOAN_REPAYMENT'   ? 'active'
                                     : 'underreview'">
                        {{ tx.transactionType | titlecase }}
                      </span>
                    </td>
                    <td>
                      <div style="font-weight:600;font-size:13px;">{{ tx.customerName || '—' }}</div>
                    </td>
                    <td style="font-size:13px;max-width:180px;word-break:break-word;">
                      {{ tx.debitAccount || (tx.accountName || '—') }}
                    </td>
                    <td style="font-size:13px;max-width:180px;word-break:break-word;">
                      {{ tx.creditAccount || '—' }}
                    </td>
                    <td style="text-align:right;font-weight:700;"
                        [style.color]="tx.transactionType === 'LOAN_DISBURSEMENT'
                          ? 'var(--danger)' : 'var(--success)'">
                      {{ tx.transactionType === 'LOAN_DISBURSEMENT' ? '−' : '+' }}
                      {{ tx.amount | currency:'ETB':'symbol':'1.2-2' }}
                    </td>
                    <td style="font-size:13px;max-width:200px;overflow:hidden;
                               text-overflow:ellipsis;white-space:nowrap;"
                        [title]="tx.description">
                      {{ tx.description }}
                    </td>
                    <td style="font-size:13px;">
                      <span *ngIf="tx.loanApplicationNumber" style="font-family:monospace;">
                        {{ tx.loanApplicationNumber }}
                      </span>
                      <span *ngIf="!tx.loanApplicationNumber" style="opacity:.5;">—</span>
                    </td>
                    <td>
                      <span style="background:#d4edda;color:#155724;padding:3px 9px;
                                   border-radius:20px;font-size:12px;font-weight:600;">
                        {{ tx.status || 'COMPLETED' }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="txLoading">
                    <td colspan="10" class="empty-state"><p>Loading…</p></td>
                  </tr>
                  <tr *ngIf="!txLoading && !filteredTransactions.length">
                    <td colspan="10" class="empty-state">
                      <p>No transactions match the current filters.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="padding:12px 20px;font-size:13px;color:var(--text-muted);border-top:1px solid var(--border-color);">
              Showing {{ filteredTransactions.length }} of {{ transactions.length }} transactions
            </div>
          </div>

        </ng-container>


        <!-- ══════════════════════════════════════════════════════════════
             TAB: REPAYMENT SCHEDULES
             ══════════════════════════════════════════════════════════════ -->
        <ng-container *ngIf="activeTab() === 'repayments'">

          <!-- Repayment sub-tabs -->
          <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
            <button *ngFor="let t of repaymentTabs"
                    (click)="repaymentTab.set(t.key)"
                    [style.background]="repaymentTab() === t.key ? 'var(--primary-teal)' : 'white'"
                    [style.color]="repaymentTab() === t.key ? 'white' : 'var(--text-dark)'"
                    style="padding:7px 16px;border:1px solid var(--border-color);
                           border-radius:20px;cursor:pointer;font-size:13px;font-weight:600;">
              {{ t.label }}
            </button>
          </div>

          <!-- Repayment search -->
          <div style="margin-bottom:16px;">
            <input type="text"
                   [(ngModel)]="repaymentSearch"
                   placeholder="Search by loan app # or customer…"
                   style="width:100%;max-width:420px;padding:9px 12px;
                          border:1px solid var(--border-color);border-radius:6px;font-size:14px;" />
          </div>

          <!-- Repayment table -->
          <div class="table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Loan App</th>
                    <th>Inst #</th>
                    <th style="text-align:right;">Amount Due</th>
                    <th style="text-align:right;">Amount Paid</th>
                    <th style="text-align:right;">Remaining</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style="text-align:center;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of filteredRepayments()"
                      style="border-bottom:1px solid var(--border-color);">
                    <td style="font-weight:600;color:var(--primary-purple);">
                      {{ item.loanApplicationNumber || 'Loan #' + item.loanId }}
                    </td>
                    <td>{{ item.installmentNumber }}</td>
                    <td style="text-align:right;font-weight:600;">
                      {{ item.amountDue | currency:'ETB':'symbol':'1.2-2' }}
                    </td>
                    <td style="text-align:right;color:var(--success);">
                      {{ item.amountPaid | currency:'ETB':'symbol':'1.2-2' }}
                    </td>
                    <td style="text-align:right;font-weight:600;color:var(--primary-purple);">
                      {{ item.remainingBalance | currency:'ETB':'symbol':'1.2-2' }}
                    </td>
                    <td style="white-space:nowrap;">{{ item.dueDate }}</td>
                    <td>
                      <span class="status-badge"
                            [ngClass]="item.status === 'PAID'    ? 'active'
                                     : item.status === 'OVERDUE' ? 'rejected'
                                     : 'underreview'">
                        {{ item.status }}
                      </span>
                    </td>
                    <td style="text-align:center;">
                      <button class="btn-small"
                              (click)="openEditModal(item)">
                        Edit
                      </button>
                      <span *ngIf="item.status === 'PAID'"
                            style="color:var(--success);font-size:13px;font-weight:600;">
                        ✅ Paid
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="rpLoading">
                    <td colspan="8" class="empty-state"><p>Loading…</p></td>
                  </tr>
                  <tr *ngIf="!rpLoading && filteredRepayments().length === 0">
                    <td colspan="8" class="empty-state">
                      <p>No repayment records match the current filter.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </ng-container>

      </div><!-- /page-content -->
    </div><!-- /page-wrapper -->


    <!-- ══════════════════════════════════════════════════════════════════
         EDIT REPAYMENT MODAL
         ══════════════════════════════════════════════════════════════════ -->
    <div *ngIf="editModalOpen()"
         style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;
                display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:12px;padding:28px;max-width:400px;
                  width:100%;box-shadow:0 20px 60px rgba(0,0,0,.25);">
        <div style="display:flex;justify-content:space-between;align-items:center;
                    margin-bottom:20px;">
          <h2 style="margin:0;color:var(--primary-purple);">Edit Repayment Record</h2>
          <button (click)="closeEditModal()"
                  style="background:none;border:none;font-size:18px;cursor:pointer;opacity:.6;">
            ✕
          </button>
        </div>

        <div style="background:var(--light-bg);padding:12px;border-radius:6px;
                    font-size:13px;margin-bottom:18px;">
          <p style="margin:0 0 4px;"><strong>Loan App:</strong>
            {{ editTarget()?.loanApplicationNumber }}</p>
          <p style="margin:0;"><strong>Installment #:</strong>
            {{ editTarget()?.installmentNumber }}</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group">
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:5px;">
              Amount Due (ETB) *
            </label>
            <input type="number" [(ngModel)]="editForm.amount" min="1"
                   style="width:100%;padding:9px;border:1px solid var(--border-color);
                          border-radius:6px;" />
          </div>
          <div class="form-group">
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:5px;">
              Admin Notes
            </label>
            <input type="text" [(ngModel)]="editForm.remarks"
                   placeholder="Reason for adjustment…"
                   style="width:100%;padding:9px;border:1px solid var(--border-color);
                          border-radius:6px;" />
          </div>
          <div *ngIf="editError"
               style="color:var(--danger);font-size:13px;">{{ editError }}</div>
          <div *ngIf="editSuccess"
               style="color:var(--success);font-size:13px;">{{ editSuccess }}</div>
          <div style="display:flex;gap:10px;">
            <button (click)="submitEdit()" [disabled]="editSaving"
                    style="flex:1;padding:10px;background:var(--primary-teal);color:white;
                           border:none;border-radius:6px;cursor:pointer;font-weight:700;">
              {{ editSaving ? 'Saving…' : 'Save Changes' }}
            </button>
            <button (click)="closeEditModal()"
                    style="padding:10px 18px;border:1px solid var(--border-color);
                           border-radius:6px;cursor:pointer;">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  transactionService = inject(TransactionService);
  repaymentService   = inject(RepaymentService);
  dashboardService   = inject(DashboardService);
  loanService        = inject(LoanService);

  // ── Tab state ─────────────────────────────────────────────────────
  activeTab    = signal<ActiveTab>('transactions');
  repaymentTab = signal<string>('all');

  readonly repaymentTabs = [
    { key: 'all',     label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'paid',    label: 'Paid' }
  ];

  // ── Transaction state ──────────────────────────────────────────────
  transactions:         any[] = [];
  filteredTransactions: any[] = [];
  txLoading  = true;
  txSearch   = '';
  txType     = 'ALL';
  txStart    = '';
  txEnd      = '';
  txCustomer = '';
  txAccount  = '';

  // ── Repayment state ────────────────────────────────────────────────
  repayments     = signal<RepaymentResponse[]>([]);
  repaymentStats = signal<any>({
    totalPaid: 0, remainingBalance: 0,
    overdueInstallments: 0, repaymentProgress: 0
  });
  rpLoading     = true;
  repaymentSearch = '';

  // ── Edit modal ─────────────────────────────────────────────────────
  editModalOpen = signal(false);
  editTarget    = signal<RepaymentResponse | null>(null);
  editForm      = { amount: 0, remarks: '' };
  editSaving    = false;
  editError     = '';
  editSuccess   = '';

  // ── Computed ───────────────────────────────────────────────────────
  totalDisbursed = computed(() =>
    this.transactions
      .filter(t => t.transactionType === 'LOAN_DISBURSEMENT')
      .reduce((s, t) => s + Number(t.amount ?? 0), 0)
  );

  filteredRepayments = computed(() => {
    let list = this.repayments();
    const q  = this.repaymentSearch.toLowerCase();
    if (q) {
      list = list.filter(r =>
        (r.loanApplicationNumber || '').toLowerCase().includes(q) ||
        r.loanId.toString().includes(q)
      );
    }
    const tab = this.repaymentTab();
    if (tab === 'pending') list = list.filter(r => r.status === 'PENDING' || r.status === 'PARTIALLY_PAID');
    if (tab === 'overdue') list = list.filter(r => r.status === 'OVERDUE');
    if (tab === 'paid')    list = list.filter(r => r.status === 'PAID');
    return list;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit() {
    this.loadTransactions();
    this.loadRepayments();
  }

  refresh() {
    this.loadTransactions();
    this.loadRepayments();
  }

  // ── Transaction methods ────────────────────────────────────────────
  loadTransactions() {
    this.txLoading = true;
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.transactions = data || [];
        this.applyTxFilters();
        this.txLoading = false;
      },
      error: (err) => {
        console.error('Error fetching transactions:', err);
        this.txLoading = false;
      }
    });
  }

  applyTxFilters() {
    this.filteredTransactions = this.transactions.filter(tx => {
      const q = this.txSearch.toLowerCase();
      const matchText =
        !q ||
        (tx.accountNumber         && tx.accountNumber.toLowerCase().includes(q))         ||
        (tx.accountName           && tx.accountName.toLowerCase().includes(q))            ||
        (tx.loanApplicationNumber && tx.loanApplicationNumber.toLowerCase().includes(q)) ||
        (tx.description           && tx.description.toLowerCase().includes(q))            ||
        (tx.customerName          && tx.customerName.toLowerCase().includes(q))           ||
        (tx.transactionRef        && tx.transactionRef.toLowerCase().includes(q))         ||
        (tx.debitAccount          && tx.debitAccount.toLowerCase().includes(q))           ||
        (tx.creditAccount         && tx.creditAccount.toLowerCase().includes(q));

      const matchType = this.txType === 'ALL' || tx.transactionType === this.txType;

      const matchCustomer = !this.txCustomer ||
        (tx.customerName && tx.customerName.toLowerCase().includes(this.txCustomer.toLowerCase()));

      const matchAccount = !this.txAccount ||
        (tx.accountNumber && tx.accountNumber.toLowerCase().includes(this.txAccount.toLowerCase())) ||
        (tx.debitAccount  && tx.debitAccount.toLowerCase().includes(this.txAccount.toLowerCase()))  ||
        (tx.creditAccount && tx.creditAccount.toLowerCase().includes(this.txAccount.toLowerCase()));

      let matchDate = true;
      if (tx.transactionDate) {
        const t = new Date(tx.transactionDate).getTime();
        if (this.txStart && t < new Date(this.txStart + 'T00:00:00').getTime()) matchDate = false;
        if (this.txEnd   && t > new Date(this.txEnd   + 'T23:59:59').getTime()) matchDate = false;
      }
      return matchText && matchType && matchCustomer && matchAccount && matchDate;
    });
  }

  resetTxFilters() {
    this.txSearch   = '';
    this.txType     = 'ALL';
    this.txStart    = '';
    this.txEnd      = '';
    this.txCustomer = '';
    this.txAccount  = '';
    this.applyTxFilters();
  }

  // ── Repayment methods ──────────────────────────────────────────────
  loadRepayments() {
    this.rpLoading = true;
    this.loanService.getLoanApplications().pipe(
      switchMap(loans => {
        const activeLoans = loans.filter(l => l.status === 'DISBURSED' || l.status === 'COMPLETED');
        if (activeLoans.length === 0) {
          return of([] as RepaymentResponse[]);
        }
        const requests = activeLoans.map(loan =>
          this.repaymentService.getRepaymentsByLoan(loan.id).pipe(
            catchError(err => {
              console.error(`Error loading repayments for loan ${loan.id}:`, err);
              return of([] as RepaymentResponse[]);
            })
          )
        );
        return forkJoin(requests).pipe(
          map(results => results.reduce((acc, curr) => acc.concat(curr), [] as RepaymentResponse[]))
        );
      })
    ).subscribe({
      next: (data: RepaymentResponse[]) => {
        this.repayments.set(data || []);
        this.rpLoading = false;

        // ── Compute admin-scoped repayment statistics ────────────────────────
        // Uses the schedules already fetched via the per-loan admin endpoint
        // (/api/repayment-schedules/loan-application/{id}), which returns
        // system-wide data. This replaces the previous call to
        // getRepaymentStats() which internally hit /my-schedules (customer-
        // scoped) and returned an empty list for admin users, causing all
        // four repayment stat cards to display 0.
        const stats = this.repaymentService.computeStatsFromSchedules(data || []);
        this.repaymentStats.set(stats);
      },
      error: (err: any) => {
        console.error('Error fetching repayments:', err);
        this.rpLoading = false;
      }
    });
  }

  openEditModal(item: RepaymentResponse) {
    this.editTarget.set(item);
    this.editForm    = { amount: item.amountDue, remarks: item.remarks || '' };
    this.editError   = '';
    this.editSuccess = '';
    this.editModalOpen.set(true);
  }

  closeEditModal() {
    this.editModalOpen.set(false);
    this.editTarget.set(null);
  }

  submitEdit() {
    const item = this.editTarget();
    if (!item) return;

    this.editSaving  = true;
    this.editError   = '';
    this.editSuccess = '';

    // Simulate local update since backend doesn't support manual modification
    item.amountDue = this.editForm.amount;
    item.remainingBalance = this.editForm.amount - item.amountPaid;
    item.remarks = this.editForm.remarks;

    setTimeout(() => {
      this.editSaving  = false;
      this.editSuccess = 'Record updated successfully (Simulation).';
      this.repayments.set([...this.repayments()]);
      setTimeout(() => this.closeEditModal(), 1200);
    }, 800);
  }
}
