import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { AccountService } from '../../../core/services/account.service';
import { RepaymentService } from '../../../core/services/repayment.service';
import { TransactionService } from '../../../core/services/transaction.service';

type AccountView = 'list' | 'savings' | 'repayment';

interface SavingsAccount {
  accountNumber: string;
  accountType:   string;
  currency:      string;
  balance:       number;
  openedDate:    string;
  branch:        string;
  status:        string;
}

interface PaymentHistoryEntry {
  date:             string;
  description:      string;
  amount:           number;
  status:           'PAID' | 'PENDING' | 'OVERDUE';
  remainingBalance: number;
}

@Component({
  selector: 'app-your-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, DecimalPipe],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>

      <div class="page-header">
        <div>
          <h1>Your Accounts</h1>
          <p>View and manage your savings and loan repayment accounts</p>
        </div>
      </div>

      <div class="page-content">

        <!-- ── Global success toast ──────────────────────────────────── -->
        <div *ngIf="successMsg"
             style="background:#d4edda;color:#155724;padding:14px 18px;border-radius:6px;
                    border-left:4px solid #27ae60;margin-bottom:20px;font-weight:600;font-size:14px;">
          ✅ {{ successMsg }}
        </div>

        <div *ngIf="errorMsg"
             style="background:#f8d7da;color:#721c24;padding:14px 18px;border-radius:6px;
                    border-left:4px solid #e74c3c;margin-bottom:20px;font-weight:600;font-size:14px;">
          ❌ {{ errorMsg }}
        </div>

        <!-- ════════════════════════════════════════════════════════════
             ACCOUNT SELECTION LIST
             ════════════════════════════════════════════════════════════ -->
        <div *ngIf="view() === 'list'"
             style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">

          <div (click)="view.set('savings')"
               style="background:white;border-radius:12px;padding:28px;cursor:pointer;
                      border:1px solid var(--border-color);transition:box-shadow .2s,transform .15s;"
               onmouseenter="this.style.boxShadow='0 6px 20px rgba(49,46,129,.18)';this.style.transform='translateY(-2px)'"
               onmouseleave="this.style.boxShadow='none';this.style.transform='none'">
            <div style="font-size:42px;margin-bottom:14px;">🏦</div>
            <h2 style="margin:0 0 6px;color:var(--primary-purple);">Savings Account</h2>
            <p style="margin:0;font-size:14px;opacity:.7;line-height:1.5;">
              View your current savings balance, account details, and branch information.
            </p>
            <div style="margin-top:20px;color:var(--primary-teal);font-weight:600;font-size:14px;">
              View Details →
            </div>
          </div>

          <div (click)="view.set('repayment')"
               style="background:white;border-radius:12px;padding:28px;cursor:pointer;
                      border:1px solid var(--border-color);transition:box-shadow .2s,transform .15s;"
               onmouseenter="this.style.boxShadow='0 6px 20px rgba(0,175,169,.2)';this.style.transform='translateY(-2px)'"
               onmouseleave="this.style.boxShadow='none';this.style.transform='none'">
            <div style="font-size:42px;margin-bottom:14px;">💳</div>
            <h2 style="margin:0 0 6px;color:var(--primary-purple);">Repayment Account</h2>
            <p style="margin:0;font-size:14px;opacity:.7;line-height:1.5;">
              Track your loan balance, this month's payment, history, and pay instantly.
            </p>
            <div style="margin-top:20px;color:var(--primary-teal);font-weight:600;font-size:14px;">
              View Details →
            </div>
          </div>

        </div>


        <!-- ════════════════════════════════════════════════════════════
             SAVINGS ACCOUNT DETAIL
             ════════════════════════════════════════════════════════════ -->
        <div *ngIf="view() === 'savings'">
          <button (click)="view.set('list')" class="back-btn"
                  style="margin-bottom:20px;padding:7px 16px;background:white;
                         border:1px solid var(--border-color);border-radius:6px;
                         cursor:pointer;font-size:13px;">
            ← Back to Accounts
          </button>

          <div style="background:white;border-radius:12px;border:1px solid var(--border-color);overflow:hidden;">
            <div style="background:linear-gradient(135deg,var(--primary-purple),#4a47a3);
                        padding:28px 30px;color:white;">
              <div style="font-size:32px;margin-bottom:10px;">🏦</div>
              <h2 style="margin:0 0 4px;font-size:22px;">Savings Account</h2>
              <p style="margin:0;opacity:.8;font-size:14px;">{{ savings.accountNumber }}</p>
            </div>

            <div style="background:#f8f9ff;padding:24px 30px;border-bottom:1px solid #eef;">
              <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;
                        letter-spacing:.06em;opacity:.6;font-weight:600;">Current Balance</p>
              <p style="margin:0;font-size:36px;font-weight:700;color:var(--primary-purple);">
                {{ savings.balance | number:'1.2-2' }}
                <span style="font-size:16px;font-weight:400;opacity:.65;margin-left:4px;">{{ savings.currency }}</span>
              </p>
            </div>

            <div style="padding:28px 30px;display:grid;
                        grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:22px;">
              <div *ngFor="let f of savingsFields()">
                <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;
                           letter-spacing:.05em;opacity:.55;font-weight:600;">{{ f.label }}</p>
                <ng-container *ngIf="f.badge; else plainField">
                  <span style="padding:4px 12px;border-radius:12px;font-size:12px;font-weight:700;
                               background:#d4edda;color:#155724;">{{ f.value }}</span>
                </ng-container>
                <ng-template #plainField>
                  <p style="margin:0;font-weight:600;font-size:15px;">{{ f.value }}</p>
                </ng-template>
              </div>
            </div>
          </div>
        </div>


        <!-- ════════════════════════════════════════════════════════════
             REPAYMENT ACCOUNT DETAIL
             ════════════════════════════════════════════════════════════ -->
        <div *ngIf="view() === 'repayment'">
          <button (click)="view.set('list')"
                  style="margin-bottom:20px;padding:7px 16px;background:white;
                         border:1px solid var(--border-color);border-radius:6px;
                         cursor:pointer;font-size:13px;">
            ← Back to Accounts
          </button>

          <!-- ── 1. Summary cards ──────────────────────────────────── -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
                      gap:16px;margin-bottom:24px;">
            <div style="background:white;border-radius:10px;padding:20px;
                        border-left:4px solid var(--primary-purple);
                        border:1px solid var(--border-color);border-left-width:4px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.05em;opacity:.6;font-weight:600;">Total Loan Amount</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:var(--primary-purple);">
                {{ loanData.originalAmount | number:'1.2-2' }}
                <span style="font-size:13px;font-weight:400;opacity:.6;"> ETB</span>
              </p>
            </div>

            <div style="background:white;border-radius:10px;padding:20px;
                        border-left:4px solid var(--success);
                        border:1px solid var(--border-color);border-left-width:4px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.05em;opacity:.6;font-weight:600;">Total Paid</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:var(--success);">
                {{ totalPaid() | number:'1.2-2' }}
                <span style="font-size:13px;font-weight:400;opacity:.6;"> ETB</span>
              </p>
            </div>

            <div style="background:white;border-radius:10px;padding:20px;
                        border-left:4px solid var(--danger);
                        border:1px solid var(--border-color);border-left-width:4px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.05em;opacity:.6;font-weight:600;">Remaining Balance</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:var(--danger);">
                {{ remainingBalance() | number:'1.2-2' }}
                <span style="font-size:13px;font-weight:400;opacity:.6;"> ETB</span>
              </p>
            </div>

            <div style="background:white;border-radius:10px;padding:20px;
                        border-left:4px solid var(--primary-teal);
                        border:1px solid var(--border-color);border-left-width:4px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.05em;opacity:.6;font-weight:600;">Repayment Progress</p>
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:var(--primary-teal);">
                {{ progress() | number:'1.1-1' }}%
              </p>
              <div style="background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;">
                <div [style.width.%]="progress()"
                     style="background:var(--primary-teal);height:100%;
                            transition:width .6s ease-in-out;border-radius:4px;">
                </div>
              </div>
            </div>
          </div>

          <!-- ── 2. This Month's Payment card ──────────────────────── -->
          <div style="background:white;border-radius:12px;border:1px solid var(--border-color);
                      padding:24px 28px;margin-bottom:24px;">
            <h3 style="margin:0 0 18px;color:var(--primary-purple);font-size:16px;">
              📅 This Month's Payment
            </h3>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px;
                        margin-bottom:20px;">
              <div>
                <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;
                           opacity:.6;font-weight:600;letter-spacing:.05em;">Scheduled Amount</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:var(--primary-teal);">
                  {{ loanData.monthlyPayment | number:'1.2-2' }} ETB
                </p>
              </div>
              <div>
                <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;
                           opacity:.6;font-weight:600;letter-spacing:.05em;">Due Date</p>
                <p style="margin:0;font-size:15px;font-weight:600;">{{ loanData.nextDueDate }}</p>
              </div>
              <div>
                <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;
                           opacity:.6;font-weight:600;letter-spacing:.05em;">Status</p>
                <span [style.background]="loanData.paid ? '#d4edda' : '#fff3cd'"
                      [style.color]="loanData.paid ? '#155724' : '#856404'"
                      style="display:inline-block;padding:4px 12px;border-radius:12px;
                             font-size:12px;font-weight:700;">
                  {{ loanData.paid ? 'PAID' : 'PENDING' }}
                </span>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
              <button [disabled]="loanData.paid"
                      (click)="openConfirm()"
                      [style.background]="loanData.paid ? '#9ca3af' : 'var(--primary-teal)'"
                      [style.cursor]="loanData.paid ? 'not-allowed' : 'pointer'"
                      [style.opacity]="loanData.paid ? '.65' : '1'"
                      style="padding:11px 30px;color:white;border:none;border-radius:8px;
                             font-size:14px;font-weight:700;transition:opacity .2s;">
                {{ loanData.paid ? '✅ Payment Complete' : '💳 Pay Now' }}
              </button>
              <p *ngIf="loanData.paid"
                 style="margin:0;font-size:13px;color:var(--success);font-weight:600;">
                This month's instalment has been paid.
              </p>
            </div>
          </div>

          <!-- ── 3. Transaction / Payment History ───────────────────── -->
          <div style="background:white;border-radius:12px;border:1px solid var(--border-color);
                      overflow:hidden;">
            <div style="padding:18px 24px;border-bottom:1px solid var(--border-color);
                        display:flex;justify-content:space-between;align-items:center;">
              <h3 style="margin:0;color:var(--primary-purple);font-size:16px;">
                🧾 Payment History
              </h3>
              <span style="font-size:13px;opacity:.6;">{{ history().length }} transaction(s)</span>
            </div>

            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                  <tr style="background:var(--light-bg);">
                    <th style="padding:12px 18px;text-align:left;font-weight:700;
                               color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Date</th>
                    <th style="padding:12px 18px;text-align:left;font-weight:700;
                               color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Description</th>
                    <th style="padding:12px 18px;text-align:right;font-weight:700;
                               color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Amount (ETB)</th>
                    <th style="padding:12px 18px;text-align:center;font-weight:700;
                               color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Status</th>
                    <th style="padding:12px 18px;text-align:right;font-weight:700;
                               color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Remaining (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let h of history(); let odd = odd"
                      [style.background]="odd ? 'var(--light-bg)' : 'white'"
                      style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:12px 18px;white-space:nowrap;">{{ h.date }}</td>
                    <td style="padding:12px 18px;">{{ h.description }}</td>
                    <td style="padding:12px 18px;text-align:right;font-weight:600;
                               color:var(--success);">
                      {{ h.amount | number:'1.2-2' }}
                    </td>
                    <td style="padding:12px 18px;text-align:center;">
                      <span [style.background]="statusBg(h.status)"
                            [style.color]="statusColor(h.status)"
                            style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;">
                        {{ h.status }}
                      </span>
                    </td>
                    <td style="padding:12px 18px;text-align:right;">
                      {{ h.remainingBalance | number:'1.2-2' }}
                    </td>
                  </tr>
                  <tr *ngIf="history().length === 0">
                    <td colspan="5"
                        style="padding:36px;text-align:center;color:#94a3b8;font-size:14px;">
                      No payment history yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div><!-- /repayment view -->

      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════
         CONFIRMATION MODAL
         ════════════════════════════════════════════════════════════════ -->
    <div *ngIf="showConfirm"
         style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;
                display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:12px;padding:32px 30px;
                  max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.25);">
        <h2 style="margin:0 0 14px;color:var(--primary-purple);">Confirm Payment</h2>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">
          You are about to pay this month's instalment of:
        </p>
        <p style="margin:0 0 16px;font-size:28px;font-weight:700;color:var(--primary-teal);">
          {{ loanData.monthlyPayment | number:'1.2-2' }} ETB
        </p>
        <p style="margin:0 0 24px;font-size:13px;opacity:.7;line-height:1.6;">
          This will be deducted from your remaining loan balance and recorded in
          your payment history.
        </p>
        <div style="display:flex;gap:12px;">
          <button (click)="confirmPayment()"
                  style="flex:1;padding:12px;background:var(--primary-teal);color:white;
                         border:none;border-radius:8px;font-size:15px;font-weight:700;
                         cursor:pointer;">
            ✅ Confirm
          </button>
          <button (click)="showConfirm = false"
                  style="flex:1;padding:12px;background:white;
                         border:1px solid var(--border-color);border-radius:8px;
                         font-size:15px;cursor:pointer;">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `
})
export class YourAccountsComponent implements OnInit {

  private accountService = inject(AccountService);
  private repaymentService = inject(RepaymentService);
  private transactionService = inject(TransactionService);

  view = signal<AccountView>('list');
  showConfirm = false;
  successMsg  = '';
  errorMsg = '';

  savings: SavingsAccount = {
    accountNumber: 'N/A',
    accountType:   'Savings Account',
    currency:      'ETB',
    balance:       0,
    openedDate:    'N/A',
    branch:        'Addis Ababa — Main Branch',
    status:        'ACTIVE'
  };

  loanData = {
    accountNumber:    'N/A',
    loanRef:          'N/A',
    loanType:         'Loan',
    originalAmount:   0,
    monthlyPayment:   0,
    nextDueDate:      'N/A',
    paid:             true,
    repaymentId:      0
  };

  private _history = signal<PaymentHistoryEntry[]>([]);
  history = computed(() => this._history());
  
  private _totalPaid = signal<number>(0);
  totalPaid = computed(() => this._totalPaid());

  private _currentRemaining = signal<number>(0);
  remainingBalance = computed(() => this._currentRemaining());

  progress = computed(() =>
    this.loanData.originalAmount > 0 
      ? Math.min(100, (this.totalPaid() / this.loanData.originalAmount) * 100)
      : 0
  );

  savingsFields() {
    return [
      { label: 'Account Type',   value: this.savings.accountType,  badge: false },
      { label: 'Currency',       value: this.savings.currency,     badge: false },
      { label: 'Date Opened',    value: this.savings.openedDate,   badge: false },
      { label: 'Branch',         value: this.savings.branch,       badge: false },
      { label: 'Status',         value: this.savings.status,       badge: true  },
    ];
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.accountService.getMyCustomerAccounts().subscribe({
      next: (accounts) => {
        const savingAcc = accounts.find(a => a.accountType === 'SAVING');
        if (savingAcc) {
          this.savings = {
            ...this.savings,
            accountNumber: savingAcc.accountNumber,
            balance: savingAcc.currentBalance,
            currency: savingAcc.currency,
            openedDate: new Date(savingAcc.createdAt).toLocaleDateString(),
            status: savingAcc.status
          };
        }
      },
      error: (err) => console.error(err)
    });

    this.repaymentService.getCustomerRepayments().subscribe({
      next: (schedules) => {
        if (schedules && schedules.length > 0) {
          const pending = schedules.filter(s => s.status === 'PENDING' || s.status === 'OVERDUE');
          pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          
          const nextRepayment = pending[0];
          
          if (nextRepayment) {
            this.loanData = {
              ...this.loanData,
              loanRef: nextRepayment.loanApplicationNumber,
              monthlyPayment: nextRepayment.amountDue,
              nextDueDate: new Date(nextRepayment.dueDate).toLocaleDateString(),
              paid: false,
              repaymentId: nextRepayment.id
            };
          } else {
             this.loanData.paid = true;
          }
          
          const original = schedules.reduce((sum, s) => sum + s.amountDue, 0);
          this.loanData.originalAmount = original;
          
          const paid = schedules.filter(s => s.status === 'PAID').reduce((sum, s) => sum + s.amountPaid, 0);
          this._totalPaid.set(paid);
          
          this._currentRemaining.set(original - paid);
        }
      },
      error: (err) => console.error(err)
    });

    this.transactionService.getMyTransactions().subscribe({
      next: (txs) => {
        const mapped = txs.map(t => ({
          date: new Date(t.transactionDate).toLocaleDateString(),
          description: t.description,
          amount: t.amount,
          status: 'PAID',
          remainingBalance: t.balanceAfter
        } as PaymentHistoryEntry));
        this._history.set(mapped);
      },
      error: (err) => console.error(err)
    });
  }

  openConfirm() {
    this.successMsg  = '';
    this.errorMsg = '';
    this.showConfirm = true;
  }

  confirmPayment() {
    this.showConfirm = false;
    if (this.loanData.repaymentId) {
      this.repaymentService.payRepayment({
        repaymentId: this.loanData.repaymentId,
        amount: this.loanData.monthlyPayment,
        paymentMethod: 'ACCOUNT_TRANSFER'
      }).subscribe({
        next: () => {
          this.successMsg = `Payment of ${this.loanData.monthlyPayment.toLocaleString()} ETB processed successfully!`;
          setTimeout(() => this.successMsg = '', 6000);
          this.loadData();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || err.error?.message || err.message || 'Payment failed';
          setTimeout(() => this.errorMsg = '', 6000);
        }
      });
    }
  }

  statusBg(status: string): string {
    if (status === 'PAID')    return '#d4edda';
    if (status === 'OVERDUE') return '#f8d7da';
    return '#fff3cd';
  }
  statusColor(status: string): string {
    if (status === 'PAID')    return '#155724';
    if (status === 'OVERDUE') return '#721c24';
    return '#856404';
  }
}
