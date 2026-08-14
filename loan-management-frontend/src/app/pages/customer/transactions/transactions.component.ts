import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-customer-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, DecimalPipe, DatePipe],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>My Transaction History</h1>
          <p>All financial activity across your Saving and Repayment accounts</p>
        </div>
        <button (click)="load()"
                style="padding:8px 18px;background:var(--primary-teal);color:white;
                       border:none;border-radius:6px;cursor:pointer;font-size:14px;">
          🔄 Refresh
        </button>
      </div>

      <div class="page-content">

        <!-- Summary Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:28px;">

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--primary-teal);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">Total Transactions</p>
            <p style="margin:0;font-size:26px;font-weight:700;color:var(--primary-teal);">
              {{ allTransactions().length }}
            </p>
          </div>

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--danger);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">Total Disbursed</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:var(--danger);">
              {{ totalDisbursed() | number:'1.2-2' }} ETB
            </p>
          </div>

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--success);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">Total Repaid</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:var(--success);">
              {{ totalRepaid() | number:'1.2-2' }} ETB
            </p>
          </div>

          <div style="background:white;border-radius:10px;padding:20px;
                      border-left:4px solid var(--warning);
                      border:1px solid var(--border-color);border-left-width:4px;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;opacity:.6;font-weight:600;">Outstanding Balance</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:var(--warning);">
              {{ outstanding() | number:'1.2-2' }} ETB
            </p>
          </div>

        </div>

        <!-- Filters -->
        <div class="table-card" style="padding:18px 20px;margin-bottom:20px;">
          <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;">

            <div style="flex:1;min-width:220px;">
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;opacity:.75;">
                Search description / loan
              </label>
              <input type="text"
                     [(ngModel)]="searchTerm"
                     (ngModelChange)="applyFilters()"
                     placeholder="e.g. disbursement, APP-…"
                     style="width:100%;padding:9px 12px;border:1px solid var(--border-color);
                            border-radius:6px;font-size:14px;" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;opacity:.75;">Type</label>
              <select [(ngModel)]="typeFilter" (change)="applyFilters()"
                      style="padding:9px 12px;border:1px solid var(--border-color);
                             border-radius:6px;background:white;min-width:170px;">
                <option value="">All Types</option>
                <option value="LOAN_DISBURSEMENT">Disbursement</option>
                <option value="LOAN_REPAYMENT">Repayment</option>
              </select>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;opacity:.75;">From</label>
              <input type="date" [(ngModel)]="dateFrom" (change)="applyFilters()"
                     style="padding:9px;border:1px solid var(--border-color);
                            border-radius:6px;background:white;" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;opacity:.75;">To</label>
              <input type="date" [(ngModel)]="dateTo" (change)="applyFilters()"
                     style="padding:9px;border:1px solid var(--border-color);
                            border-radius:6px;background:white;" />
            </div>

            <button (click)="resetFilters()"
                    style="padding:9px 14px;border:1px solid var(--border-color);
                           border-radius:6px;cursor:pointer;background:white;">
              Reset
            </button>

          </div>
        </div>

        <!-- Error -->
        <div *ngIf="errorMsg" style="background:#f8d7da;color:#721c24;padding:14px 18px;border-radius:6px;
                                     border-left:4px solid #e74c3c;margin-bottom:20px;font-weight:600;">
          ❌ {{ errorMsg }}
        </div>

        <!-- Loading -->
        <div *ngIf="loading" style="text-align:center;padding:60px;color:var(--text-muted);">
          <div style="font-size:32px;margin-bottom:12px;">⏳</div>
          <p>Loading your transactions…</p>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading && filtered().length === 0"
             style="text-align:center;padding:60px;background:white;border-radius:10px;
                    border:1px solid var(--border-color);">
          <div style="font-size:48px;margin-bottom:12px;">📭</div>
          <p style="color:var(--text-muted);font-size:16px;">No transactions found.</p>
        </div>

        <!-- Transaction Table -->
        <div *ngIf="!loading && filtered().length > 0" class="table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Debit (From)</th>
                  <th>Credit (To)</th>
                  <th style="text-align:right;">Amount (ETB)</th>
                  <th>Description</th>
                  <th>Loan / App</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of filtered()">

                  <td style="white-space:nowrap;font-size:13px;">
                    {{ tx.transactionDate | date:'medium' }}
                  </td>

                  <td>
                    <code style="font-size:12px;background:#f4f4f4;padding:2px 6px;border-radius:4px;">
                      {{ tx.transactionRef || ('TXN-' + (tx.id | number:'6.0-0')) }}
                    </code>
                  </td>

                  <td>
                    <span [style.background]="typeBg(tx.transactionType)"
                          [style.color]="typeColor(tx.transactionType)"
                          style="padding:3px 9px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;">
                      {{ typeLabel(tx.transactionType) }}
                    </span>
                  </td>

                  <td style="font-size:13px;max-width:200px;word-break:break-word;">
                    {{ tx.debitAccount || '—' }}
                  </td>

                  <td style="font-size:13px;max-width:200px;word-break:break-word;">
                    {{ tx.creditAccount || '—' }}
                  </td>

                  <td style="text-align:right;font-weight:600;">
                    {{ tx.amount | number:'1.2-2' }}
                  </td>

                  <td style="font-size:13px;max-width:240px;word-break:break-word;">
                    {{ tx.description || '—' }}
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
              </tbody>
            </table>
          </div>

          <div style="padding:12px 20px;font-size:13px;color:var(--text-muted);border-top:1px solid var(--border-color);">
            Showing {{ filtered().length }} of {{ allTransactions().length }} transactions
          </div>
        </div>

      </div>
    </div>
  `
})
export class CustomerTransactionsComponent implements OnInit {

  private txService = inject(TransactionService);

  // ── State ──────────────────────────────────────────────────────────────────
  private _all = signal<any[]>([]);
  private _filtered = signal<any[]>([]);

  allTransactions = computed(() => this._all());
  filtered        = computed(() => this._filtered());

  loading   = false;
  errorMsg  = '';
  searchTerm = '';
  typeFilter = '';
  dateFrom   = '';
  dateTo     = '';

  // ── Computed summaries ─────────────────────────────────────────────────────
  totalDisbursed = computed(() =>
    this._all().filter(t => t.transactionType === 'LOAN_DISBURSEMENT')
               .reduce((s, t) => s + Number(t.amount ?? 0), 0)
  );
  totalRepaid = computed(() =>
    this._all().filter(t => t.transactionType === 'LOAN_REPAYMENT')
               .reduce((s, t) => s + Number(t.amount ?? 0), 0)
  );
  outstanding = computed(() => this.totalDisbursed() - this.totalRepaid());

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() { this.load(); }

  load() {
    this.loading  = true;
    this.errorMsg = '';
    this.txService.getMyTransactions().subscribe({
      next: (data) => {
        this._all.set(data || []);
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message || err.message || 'Failed to load transactions.';
        this.loading  = false;
      }
    });
  }

  applyFilters() {
    const q = this.searchTerm.toLowerCase();
    const result = this._all().filter(tx => {
      const matchText = !q
        || (tx.description            && tx.description.toLowerCase().includes(q))
        || (tx.loanApplicationNumber  && tx.loanApplicationNumber.toLowerCase().includes(q))
        || (tx.transactionRef         && tx.transactionRef.toLowerCase().includes(q))
        || (tx.debitAccount           && tx.debitAccount.toLowerCase().includes(q))
        || (tx.creditAccount          && tx.creditAccount.toLowerCase().includes(q));

      const matchType = !this.typeFilter || tx.transactionType === this.typeFilter;

      let matchDate = true;
      if (tx.transactionDate) {
        const t = new Date(tx.transactionDate).getTime();
        if (this.dateFrom && t < new Date(this.dateFrom + 'T00:00:00').getTime()) matchDate = false;
        if (this.dateTo   && t > new Date(this.dateTo   + 'T23:59:59').getTime()) matchDate = false;
      }
      return matchText && matchType && matchDate;
    });
    this._filtered.set(result);
  }

  resetFilters() {
    this.searchTerm = '';
    this.typeFilter = '';
    this.dateFrom   = '';
    this.dateTo     = '';
    this.applyFilters();
  }

  // ── Display helpers ────────────────────────────────────────────────────────
  typeLabel(type: string): string {
    const m: Record<string, string> = {
      LOAN_DISBURSEMENT: '💸 Disbursement',
      LOAN_REPAYMENT:    '💳 Repayment',
      ACCOUNT_ADJUSTMENT:'🔧 Adjustment',
    };
    return m[type] ?? type ?? '—';
  }
  typeBg(type: string): string {
    if (type === 'LOAN_DISBURSEMENT') return '#fff3cd';
    if (type === 'LOAN_REPAYMENT')    return '#d4edda';
    return '#e2e3e5';
  }
  typeColor(type: string): string {
    if (type === 'LOAN_DISBURSEMENT') return '#856404';
    if (type === 'LOAN_REPAYMENT')    return '#155724';
    return '#383d41';
  }
}
