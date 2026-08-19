import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BankService } from '../../../core/services/bank.service';
import { LoanService } from '../../../core/services/loan.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

interface LoanAccount {
  id: number;
  accountName: string;
  accountNumber: string;
  loanType: string;
  currentBalance: number;
  currency: string;
  status: string;
}

interface LoanProduct {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  interestRate: string | number;
  tenure: string | number;
  description: string;
}

@Component({
  selector: 'app-admin-banks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BackButtonComponent, DecimalPipe],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>

      <div class="page-header">
        <div>
          <h1>Loan Accounts</h1>
          <p>View and manage the 4 dedicated loan product bank accounts</p>
        </div>
        <button
          style="padding:8px 18px;background:var(--primary-teal);color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;"
          (click)="loadAccounts()">
          🔄 Refresh
        </button>
      </div>

      <div class="page-content">

        <div *ngIf="successMsg" class="success-message" style="margin-bottom:18px;">{{ successMsg }}</div>
        <div *ngIf="errorMsg"   class="error-message"   style="margin-bottom:18px;">{{ errorMsg }}</div>

        <!-- Table — always show when we have accounts -->
        <div *ngIf="accounts.length > 0" style="overflow-x:auto;background:white;border-radius:8px;border:1px solid #e0e0e0;padding:0;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="padding:12px 16px;text-align:left;border-bottom:1px solid #e0e0e0;">Loan Type</th>
                  <th style="padding:12px 16px;text-align:left;border-bottom:1px solid #e0e0e0;">Account Name</th>
                  <th style="padding:12px 16px;text-align:left;border-bottom:1px solid #e0e0e0;">Account Number</th>
                  <th style="padding:12px 16px;text-align:right;border-bottom:1px solid #e0e0e0;">Current Balance (ETB)</th>
                  <th style="padding:12px 16px;text-align:center;border-bottom:1px solid #e0e0e0;">Status</th>
                  <th style="padding:12px 16px;text-align:center;border-bottom:1px solid #e0e0e0;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let acc of accounts"
                    style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:12px 16px;">
                    {{ loanTypeIcon(acc.loanType) }} {{ formatLoanType(acc.loanType) }}
                  </td>
                  <td style="padding:12px 16px;">{{ acc.accountName }}</td>
                  <td style="padding:12px 16px;font-family:monospace;">{{ acc.accountNumber }}</td>
                  <td style="padding:12px 16px;text-align:right;font-weight:700;"
                      [style.color]="acc.currentBalance < 0 ? '#e74c3c' : '#27ae60'">
                    {{ acc.currentBalance | number:'1.2-2' }}
                  </td>
                  <td style="padding:12px 16px;text-align:center;">
                    <span [style.background]="acc.status === 'ACTIVE' ? '#d4edda' : '#f8d7da'"
                          [style.color]="acc.status === 'ACTIVE' ? '#155724' : '#721c24'"
                          style="padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;">
                      {{ acc.status }}
                    </span>
                  </td>
                  <td style="padding:12px 16px;text-align:center;">
                    <button (click)="selectAccount(acc)"
                            style="padding:6px 14px;background:var(--primary-teal,#00afa9);color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">
                      ✏️ Adjust
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        <!-- Empty state -->
        <div *ngIf="accounts.length === 0 && !errorMsg" style="padding:20px;text-align:center;color:#666;">
          <p>No accounts found. Make sure the backend is running on port 8081.</p>
        </div>

        <!-- Balance Adjustment Form -->
        <div *ngIf="selectedAccount" class="form-card"
             style="margin-top:28px;background:white;border-radius:10px;padding:28px;border:1px solid var(--border-color);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2 style="margin:0;">Adjust Balance — {{ selectedAccount.accountName }}</h2>
            <button class="btn-small btn-ghost" (click)="cancelAdjust()">✕ Close</button>
          </div>
          <p style="font-size:14px;margin-bottom:16px;">
            Current balance:
            <strong>{{ selectedAccount.currentBalance | number:'1.2-2' }} {{ selectedAccount.currency }}</strong>
          </p>
          <form [formGroup]="adjustForm" (ngSubmit)="saveBalance()" style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group">
              <label style="font-weight:600;display:block;margin-bottom:6px;">New Balance (ETB) *</label>
              <input type="number" formControlName="newBalance" placeholder="e.g. 10000000.00"
                     style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;" />
            </div>
            <div class="form-group">
              <label style="font-weight:600;display:block;margin-bottom:6px;">Remarks (optional)</label>
              <input type="text" formControlName="remarks" placeholder="e.g. Q3 top-up"
                     style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;" />
            </div>
            <div style="display:flex;gap:12px;">
              <button type="submit"
                      style="padding:10px 24px;background:var(--primary-teal);color:white;border:none;border-radius:6px;cursor:pointer;"
                      [disabled]="saving || adjustForm.invalid">
                {{ saving ? 'Saving…' : 'Set Balance' }}
              </button>
              <button type="button"
                      style="padding:10px 20px;background:white;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;"
                      (click)="cancelAdjust()">Cancel</button>
            </div>
          </form>
        </div>

        <!-- ══════════════════════════════════════════════════
             LOAN PRODUCTS SECTION
             ══════════════════════════════════════════════════ -->
        <div style="margin-top:40px;">
          <div style="margin-bottom:16px;">
            <h2 style="margin:0 0 4px;color:var(--primary-purple);font-size:18px;">Loan Products</h2>
            <p style="margin:0;font-size:14px;opacity:.65;">Available loan products and their terms</p>
          </div>

          <!-- Loading state -->
          <div *ngIf="loadingProducts" style="padding:20px;text-align:center;color:#666;">
            <p>Loading loan products…</p>
          </div>

          <!-- Products table -->
          <div *ngIf="!loadingProducts && loanProducts.length > 0"
               style="overflow-x:auto;background:white;border-radius:8px;border:1px solid #e0e0e0;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="padding:12px 16px;text-align:left;border-bottom:1px solid #e0e0e0;">Loan Type</th>
                  <th style="padding:12px 16px;text-align:right;border-bottom:1px solid #e0e0e0;">Min Amount (ETB)</th>
                  <th style="padding:12px 16px;text-align:right;border-bottom:1px solid #e0e0e0;">Max Amount (ETB)</th>
                  <th style="padding:12px 16px;text-align:center;border-bottom:1px solid #e0e0e0;">Interest Rate</th>
                  <th style="padding:12px 16px;text-align:center;border-bottom:1px solid #e0e0e0;">Tenure</th>
                  <th style="padding:12px 16px;text-align:left;border-bottom:1px solid #e0e0e0;">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of loanProducts" style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:12px 16px;font-weight:600;color:var(--primary-purple);">
                    {{ p.name }}
                  </td>
                  <td style="padding:12px 16px;text-align:right;">
                    {{ p.minAmount | number:'1.2-2' }}
                  </td>
                  <td style="padding:12px 16px;text-align:right;">
                    {{ p.maxAmount | number:'1.2-2' }}
                  </td>
                  <td style="padding:12px 16px;text-align:center;font-weight:600;color:var(--primary-teal);">
                    {{ formatInterest(p.interestRate) }}
                  </td>
                  <td style="padding:12px 16px;text-align:center;">
                    {{ formatTenure(p.tenure) }}
                  </td>
                  <td style="padding:12px 16px;color:#555;font-size:13px;">
                    {{ p.description || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          <div *ngIf="!loadingProducts && loanProducts.length === 0 && !productsError"
               style="padding:20px;text-align:center;color:#666;background:white;border-radius:8px;border:1px solid #e0e0e0;">
            <p>No loan products found.</p>
          </div>

          <!-- Error state (does not affect loan accounts above) -->
          <div *ngIf="productsError"
               style="padding:14px 18px;border-radius:6px;background:#fff5f5;border:1px solid #fecaca;color:#b91c1c;font-size:14px;">
            ⚠️ {{ productsError }}
          </div>
        </div>

      </div>
    </div>
  `
})
export class BanksComponent implements OnInit {

  accounts:        LoanAccount[]      = [];
  selectedAccount: LoanAccount | null = null;
  loading    = false;
  saving     = false;
  successMsg = '';
  errorMsg   = '';

  loanProducts:   LoanProduct[] = [];
  loadingProducts = false;
  productsError   = '';

  adjustForm: FormGroup;

  constructor(
    private bankService: BankService,
    private loanService: LoanService,
    private fb:          FormBuilder
  ) {
    this.adjustForm = this.fb.group({
      newBalance: [null as number | null, [Validators.required, Validators.min(0)]],
      remarks:    ['']
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadLoanProducts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.errorMsg   = '';
    this.successMsg = '';

    this.bankService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('[BANKS] Error loading accounts:', error);
        this.accounts = [];
        this.loading = false;
        this.errorMsg = error?.error?.message
          || error?.message
          || 'Failed to load accounts. Is the backend running on port 8081?';
      }
    });
  }

  selectAccount(acc: LoanAccount): void {
    this.selectedAccount = acc;
    this.successMsg      = '';
    this.errorMsg        = '';
    this.adjustForm.reset({ newBalance: acc.currentBalance, remarks: '' });
  }

  cancelAdjust(): void {
    this.selectedAccount = null;
    this.adjustForm.reset();
  }

  saveBalance(): void {
    if (this.adjustForm.invalid || !this.selectedAccount) return;
    this.saving     = true;
    this.errorMsg   = '';
    this.successMsg = '';

    const { newBalance, remarks } = this.adjustForm.value;
    this.bankService.updateAccountBalance(this.selectedAccount.id, newBalance!, remarks || '')
      .subscribe({
        next: (updated) => {
          this.saving     = false;
          this.successMsg = `Balance updated to ${Number(updated.currentBalance).toLocaleString()} ${updated.currency}.`;
          this.selectedAccount = null;
          this.adjustForm.reset();
          this.loadAccounts();
        },
        error: (err) => {
          this.saving   = false;
          this.errorMsg = err?.error?.message || 'Failed to update balance.';
        }
      });
  }

  loadLoanProducts(): void {
    this.loadingProducts = true;
    this.productsError   = '';
    this.loanService.getLoanProducts().subscribe({
      next: (products) => {
        this.loanProducts = (products || []).map((p: any) => ({
          id:           p.id,
          name:         p.name || p.productName || 'Loan Product',
          minAmount:    p.minimumAmount ?? p.minAmount ?? 0,
          maxAmount:    p.maximumAmount ?? p.maxAmount ?? 0,
          interestRate: p.interestRate ?? '',
          tenure:       p.repaymentPeriodMonths ?? p.tenure ?? '',
          description:  p.description || ''
        }));
        this.loadingProducts = false;
      },
      error: (err) => {
        console.error('[BANKS] Error loading loan products:', err);
        this.loanProducts    = [];
        this.loadingProducts = false;
        this.productsError   = 'Failed to load loan products.';
      }
    });
  }

  formatInterest(rate: any): string {
    if (typeof rate === 'number') return `${rate}%`;
    return rate ? String(rate) : '—';
  }

  formatTenure(tenure: any): string {
    if (typeof tenure === 'number') return `${tenure} months`;
    return tenure ? String(tenure) : '—';
  }

  formatLoanType(loanType: string): string {
    return (loanType || '').replace(/_/g, ' ')
      .toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  loanTypeIcon(loanType: string): string {
    const icons: Record<string, string> = {
      PERSONAL_LOAN: '👤', HOME_LOAN: '🏠',
      VEHICLE_LOAN: '🚗',  BUSINESS_LOAN: '💼'
    };
    return icons[loanType] ?? '🏦';
  }
}
