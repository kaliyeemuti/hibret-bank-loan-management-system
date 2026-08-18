import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { AccountService } from '../../../core/services/account.service';
import { RepaymentService, RepaymentResponse } from '../../../core/services/repayment.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { finalize } from 'rxjs';

interface Transaction {
  date:             string;
  description:      string;
  amount:           number;
  type:             string;
  balanceAfter:     number;
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
          <h1>My Account</h1>
          <p>View your balance, make repayments, deposit, and withdraw</p>
        </div>
      </div>

      <div class="page-content">

        <!-- ── Toast messages ────────────────────────────────────────── -->
        <div *ngIf="successMsg"
             style="background:#d4edda;color:#155724;padding:14px 18px;border-radius:6px;
                    border-left:4px solid #27ae60;margin-bottom:20px;font-weight:600;">
          ✅ {{ successMsg }}
        </div>
        <div *ngIf="errorMsg"
             style="background:#f8d7da;color:#721c24;padding:14px 18px;border-radius:6px;
                    border-left:4px solid #e74c3c;margin-bottom:20px;font-weight:600;">
          ❌ {{ errorMsg }}
        </div>

        <!-- Loading -->
        <div *ngIf="loadingAccount()" class="empty-state"><p>Loading account…</p></div>

        <ng-container *ngIf="!loadingAccount()">

          <!-- ════════════════════════════════════════════════════════
               ACCOUNT CARD
               ════════════════════════════════════════════════════════ -->
          <div style="background:linear-gradient(135deg,var(--primary-purple),#4a47a3);
                      border-radius:16px;padding:32px 30px;color:white;margin-bottom:28px;
                      box-shadow:0 8px 32px rgba(49,46,129,.3);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
              <div>
                <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                           letter-spacing:.08em;opacity:.7;font-weight:600;">My Account</p>
                <p style="margin:0 0 2px;font-size:13px;font-family:monospace;opacity:.75;">
                  {{ accountNumber || 'N/A' }}
                </p>
              </div>
              <span style="background:rgba(255,255,255,.15);padding:5px 14px;border-radius:20px;
                           font-size:12px;font-weight:700;letter-spacing:.06em;">ACTIVE</span>
            </div>

            <div style="margin-top:24px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;
                         letter-spacing:.06em;opacity:.65;font-weight:600;">Current Balance</p>
              <div style="display:flex;align-items:center;gap:14px;">
                <p style="margin:0;font-size:38px;font-weight:800;letter-spacing:-.02em;">
                  {{ balanceVisible() ? ((accountBalance() | number:'1.2-2') + ' ETB') : '•••••••• ETB' }}
                </p>
                <button (click)="balanceVisible.update(v=>!v)"
                        style="background:rgba(255,255,255,.15);border:none;border-radius:8px;
                               padding:8px 12px;color:white;cursor:pointer;font-size:16px;"
                        [title]="balanceVisible() ? 'Hide balance' : 'Show balance'">
                  {{ balanceVisible() ? '👁' : '👁‍🗨' }}
                </button>
              </div>
            </div>

            <!-- Action buttons -->
            <div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap;">
              <button (click)="openModal('deposit')"
                      style="padding:10px 22px;background:rgba(255,255,255,.18);color:white;
                             border:1px solid rgba(255,255,255,.4);border-radius:8px;
                             font-weight:700;cursor:pointer;font-size:14px;transition:all .2s;">
                💰 Deposit
              </button>
              <button (click)="openModal('withdraw')"
                      style="padding:10px 22px;background:rgba(255,255,255,.18);color:white;
                             border:1px solid rgba(255,255,255,.4);border-radius:8px;
                             font-weight:700;cursor:pointer;font-size:14px;transition:all .2s;">
                🏧 Withdraw
              </button>
            </div>
          </div>

          <!-- ════════════════════════════════════════════════════════
               REPAYMENT SECTION
               ════════════════════════════════════════════════════════ -->
          <div *ngIf="schedules().length > 0">

            <!-- Summary stats -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
                        gap:16px;margin-bottom:24px;">
              <div style="background:white;border-radius:10px;padding:18px;
                          border-left:4px solid var(--primary-purple);
                          border:1px solid var(--border-color);border-left-width:4px;">
                <p style="margin:0 0 5px;font-size:11px;text-transform:uppercase;
                           opacity:.6;font-weight:600;letter-spacing:.05em;">Total Loan</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:var(--primary-purple);">
                  {{ totalLoan() | number:'1.2-2' }} <span style="font-size:12px;opacity:.6;">ETB</span>
                </p>
              </div>
              <div style="background:white;border-radius:10px;padding:18px;
                          border-left:4px solid var(--success);
                          border:1px solid var(--border-color);border-left-width:4px;">
                <p style="margin:0 0 5px;font-size:11px;text-transform:uppercase;
                           opacity:.6;font-weight:600;letter-spacing:.05em;">Total Paid</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:var(--success);">
                  {{ totalPaid() | number:'1.2-2' }} <span style="font-size:12px;opacity:.6;">ETB</span>
                </p>
              </div>
              <div style="background:white;border-radius:10px;padding:18px;
                          border-left:4px solid var(--danger);
                          border:1px solid var(--border-color);border-left-width:4px;">
                <p style="margin:0 0 5px;font-size:11px;text-transform:uppercase;
                           opacity:.6;font-weight:600;letter-spacing:.05em;">Remaining</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:var(--danger);">
                  {{ loanRemaining() | number:'1.2-2' }} <span style="font-size:12px;opacity:.6;">ETB</span>
                </p>
              </div>
              <div style="background:white;border-radius:10px;padding:18px;
                          border-left:4px solid var(--primary-teal);
                          border:1px solid var(--border-color);border-left-width:4px;">
                <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;
                           opacity:.6;font-weight:600;letter-spacing:.05em;">
                  Progress &nbsp;<strong style="color:var(--primary-teal);opacity:1;">
                    {{ repaymentProgress() | number:'1.1-1' }}%
                  </strong>
                </p>
                <div style="background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;">
                  <div [style.width.%]="repaymentProgress()"
                       style="background:var(--primary-teal);height:100%;
                              transition:width .6s ease-in-out;border-radius:4px;"></div>
                </div>
              </div>
            </div>

            <!-- This month's payment -->
            <div *ngIf="nextInstallment()"
                 style="background:white;border-radius:12px;border:1px solid var(--border-color);
                        padding:22px 26px;margin-bottom:24px;">
              <h3 style="margin:0 0 16px;color:var(--primary-purple);font-size:15px;">
                📅 This Month's Payment
              </h3>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
                          gap:16px;margin-bottom:18px;">
                <div>
                  <p style="margin:0 0 3px;font-size:11px;text-transform:uppercase;opacity:.6;font-weight:600;">
                    Scheduled Amount
                  </p>
                  <p style="margin:0;font-size:18px;font-weight:700;color:var(--primary-teal);">
                    {{ nextInstallment()!.amountDue | number:'1.2-2' }} ETB
                  </p>
                </div>
                <div>
                  <p style="margin:0 0 3px;font-size:11px;text-transform:uppercase;opacity:.6;font-weight:600;">
                    Due Date
                  </p>
                  <p style="margin:0;font-size:14px;font-weight:600;">
                    {{ nextInstallment()!.dueDate | date:'MMM d, y' }}
                  </p>
                </div>
                <div>
                  <p style="margin:0 0 3px;font-size:11px;text-transform:uppercase;opacity:.6;font-weight:600;">
                    Status
                  </p>
                  <span [style.background]="nextInstallment()!.status === 'PAID' ? '#d4edda' : '#fff3cd'"
                        [style.color]="nextInstallment()!.status === 'PAID' ? '#155724' : '#856404'"
                        style="display:inline-block;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:700;">
                    {{ nextInstallment()!.status }}
                  </span>
                </div>
                <div>
                  <p style="margin:0 0 3px;font-size:11px;text-transform:uppercase;opacity:.6;font-weight:600;">
                    Interest Rate
                  </p>
                  <p style="margin:0;font-size:14px;font-weight:600;">
                    {{ nextInstallment()!.interestRate ? (nextInstallment()!.interestRate + '%') : '—' }}
                  </p>
                </div>
              </div>
              <button *ngIf="nextInstallment()!.status !== 'PAID'"
                      (click)="openConfirm(nextInstallment()!.id, nextInstallment()!.amountDue)"
                      [disabled]="paying"
                      style="padding:10px 28px;background:var(--primary-teal);color:white;
                             border:none;border-radius:8px;font-size:14px;font-weight:700;
                             cursor:pointer;transition:opacity .2s;"
                      [style.opacity]="paying ? '.6' : '1'">
                {{ paying ? 'Processing…' : '💳 Pay Now' }}
              </button>
              <span *ngIf="nextInstallment()!.status === 'PAID'"
                    style="color:var(--success);font-weight:600;font-size:14px;">
                ✅ This month's instalment is paid.
              </span>
            </div>

            <!-- Full repayment schedule -->
            <div style="background:white;border-radius:12px;border:1px solid var(--border-color);
                        overflow:hidden;margin-bottom:24px;">
              <div style="padding:16px 22px;border-bottom:1px solid var(--border-color);
                          display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;color:var(--primary-purple);font-size:15px;">📋 Repayment Schedule</h3>
                <span style="font-size:12px;opacity:.6;">{{ schedules().length }} instalment(s)</span>
              </div>
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr style="background:var(--light-bg);">
                      <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">#</th>
                      <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Due Date</th>
                      <th style="padding:10px 14px;text-align:right;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Principal</th>
                      <th style="padding:10px 14px;text-align:right;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Interest</th>
                      <th style="padding:10px 14px;text-align:right;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Total</th>
                      <th style="padding:10px 14px;text-align:center;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Status</th>
                      <th style="padding:10px 14px;text-align:center;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let s of schedules(); let odd = odd"
                        [style.background]="odd ? 'var(--light-bg)' : 'white'"
                        style="border-bottom:1px solid #f0f0f0;">
                      <td style="padding:10px 14px;font-weight:600;">{{ s.installmentNumber }}</td>
                      <td style="padding:10px 14px;white-space:nowrap;">{{ s.dueDate | date:'MMM d, y' }}</td>
                      <td style="padding:10px 14px;text-align:right;">{{ s.principalAmount | number:'1.2-2' }}</td>
                      <td style="padding:10px 14px;text-align:right;color:#856404;">{{ s.interestAmount | number:'1.2-2' }}</td>
                      <td style="padding:10px 14px;text-align:right;font-weight:600;">{{ s.amountDue | number:'1.2-2' }}</td>
                      <td style="padding:10px 14px;text-align:center;">
                        <span [style.background]="statusBg(s.status)"
                              [style.color]="statusColor(s.status)"
                              style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;">
                          {{ s.status }}
                        </span>
                      </td>
                      <td style="padding:10px 14px;text-align:center;">
                        <button *ngIf="s.status !== 'PAID'"
                                (click)="openConfirm(s.id, s.amountDue)"
                                [disabled]="payingId === s.id"
                                style="padding:5px 14px;background:var(--primary-teal);color:white;
                                       border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;"
                                [style.opacity]="payingId === s.id ? '.6' : '1'">
                          {{ payingId === s.id ? '…' : 'Pay' }}
                        </button>
                        <span *ngIf="s.status === 'PAID'" style="font-size:16px;">✅</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- No active loan -->
          <div *ngIf="!loadingSchedules && schedules().length === 0"
               style="background:white;border-radius:12px;border:1px solid var(--border-color);
                      padding:32px;text-align:center;margin-bottom:24px;opacity:.6;">
            <p style="margin:0;font-size:15px;">No active repayment schedule.</p>
            <p style="margin:8px 0 0;font-size:13px;">Your repayment schedule will appear here after a loan is disbursed.</p>
          </div>

          <!-- ════════════════════════════════════════════════════════
               TRANSACTION HISTORY
               ════════════════════════════════════════════════════════ -->
          <div style="background:white;border-radius:12px;border:1px solid var(--border-color);overflow:hidden;">
            <div style="padding:16px 22px;border-bottom:1px solid var(--border-color);
                        display:flex;justify-content:space-between;align-items:center;">
              <h3 style="margin:0;color:var(--primary-purple);font-size:15px;">🧾 Transaction History</h3>
              <span style="font-size:12px;opacity:.6;">{{ transactions().length }} record(s)</span>
            </div>
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                  <tr style="background:var(--light-bg);">
                    <th style="padding:10px 16px;text-align:left;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Date</th>
                    <th style="padding:10px 16px;text-align:left;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Description</th>
                    <th style="padding:10px 16px;text-align:center;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Type</th>
                    <th style="padding:10px 16px;text-align:right;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Amount (ETB)</th>
                    <th style="padding:10px 16px;text-align:right;font-weight:700;color:var(--primary-purple);border-bottom:1px solid var(--border-color);">Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let t of transactions(); let odd = odd"
                      [style.background]="odd ? 'var(--light-bg)' : 'white'"
                      style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:10px 16px;white-space:nowrap;">{{ t.date }}</td>
                    <td style="padding:10px 16px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                        [title]="t.description">{{ t.description }}</td>
                    <td style="padding:10px 16px;text-align:center;">
                      <span [style.background]="txTypeBg(t.type)"
                            [style.color]="txTypeColor(t.type)"
                            style="padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700;white-space:nowrap;">
                        {{ txTypeLabel(t.type) }}
                      </span>
                    </td>
                    <td style="padding:10px 16px;text-align:right;font-weight:700;"
                        [style.color]="isCreditType(t.type) ? 'var(--success)' : 'var(--danger)'">
                      {{ isCreditType(t.type) ? '+' : '−' }}{{ t.amount | number:'1.2-2' }}
                    </td>
                    <td style="padding:10px 16px;text-align:right;">{{ t.balanceAfter | number:'1.2-2' }}</td>
                  </tr>
                  <tr *ngIf="transactions().length === 0">
                    <td colspan="5" style="padding:32px;text-align:center;color:#94a3b8;">
                      No transactions yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </ng-container><!-- /!loadingAccount -->
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         PAY CONFIRMATION MODAL
         ══════════════════════════════════════════════════════════════ -->
    <div *ngIf="showConfirm"
         style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;
                display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:12px;padding:30px;max-width:400px;width:100%;
                  box-shadow:0 20px 60px rgba(0,0,0,.25);">
        <h2 style="margin:0 0 12px;color:var(--primary-purple);">Confirm Payment</h2>
        <p style="margin:0 0 6px;font-size:14px;">Paying instalment of:</p>
        <p style="margin:0 0 14px;font-size:26px;font-weight:700;color:var(--primary-teal);">
          {{ pendingAmount | number:'1.2-2' }} ETB
        </p>
        <p style="margin:0 0 22px;font-size:12px;opacity:.65;line-height:1.6;">
          This amount will be debited from your My Account balance.
        </p>
        <div style="display:flex;gap:12px;">
          <button (click)="confirmPayment()" [disabled]="paying"
                  style="flex:1;padding:11px;background:var(--primary-teal);color:white;
                         border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;"
                  [style.opacity]="paying ? '.6' : '1'">
            {{ paying ? 'Processing…' : '✅ Confirm' }}
          </button>
          <button (click)="showConfirm=false" [disabled]="paying"
                  style="flex:1;padding:11px;background:white;
                         border:1px solid var(--border-color);border-radius:8px;font-size:14px;cursor:pointer;">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         DEPOSIT / WITHDRAW MODAL
         ══════════════════════════════════════════════════════════════ -->
    <div *ngIf="showModal"
         style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;
                display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:12px;padding:30px;max-width:400px;width:100%;
                  box-shadow:0 20px 60px rgba(0,0,0,.25);">
        <h2 style="margin:0 0 18px;color:var(--primary-purple);">
          {{ modalMode === 'deposit' ? '💰 Deposit Funds' : '🏧 Withdraw Funds' }}
        </h2>
        <p style="margin:0 0 6px;font-size:13px;opacity:.65;line-height:1.55;">
          {{ modalMode === 'deposit'
             ? 'Add funds to your My Account. Simulated cash deposit.'
             : 'Withdraw funds from your My Account. Balance cannot go negative.' }}
        </p>
        <p style="margin:0 0 18px;font-size:13px;font-weight:600;color:var(--primary-purple);">
          Current balance: {{ accountBalance() | number:'1.2-2' }} ETB
        </p>
        <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--primary-purple);">
          Amount (ETB)
        </label>
        <input [(ngModel)]="modalAmount" type="number" min="1" step="0.01"
               placeholder="Enter amount"
               style="width:100%;padding:11px;border:1px solid var(--border-color);
                      border-radius:8px;font-size:15px;margin-bottom:20px;box-sizing:border-box;">
        <div style="display:flex;gap:12px;">
          <button (click)="confirmModal()" [disabled]="modalAmount<=0 || modalBusy"
                  [style.background]="modalMode === 'deposit' ? 'var(--primary-purple)' : 'var(--danger)'"
                  [style.opacity]="modalAmount<=0 || modalBusy ? '.5' : '1'"
                  style="flex:1;padding:11px;color:white;border:none;border-radius:8px;
                         font-size:14px;font-weight:700;cursor:pointer;">
            {{ modalBusy ? 'Processing…' : (modalMode === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal') }}
          </button>
          <button (click)="showModal=false" [disabled]="modalBusy"
                  style="flex:1;padding:11px;background:white;
                         border:1px solid var(--border-color);border-radius:8px;font-size:14px;cursor:pointer;">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `
})
export class YourAccountsComponent implements OnInit {

  private accountService     = inject(AccountService);
  private repaymentService   = inject(RepaymentService);
  private transactionService = inject(TransactionService);

  // ── Account state ─────────────────────────────────────────────────
  loadingAccount   = signal(true);
  accountNumber    = '';
  accountBalance   = signal<number>(0);
  balanceVisible   = signal(true);

  // ── Repayment state ───────────────────────────────────────────────
  loadingSchedules = true;
  private _schedules = signal<RepaymentResponse[]>([]);
  schedules          = this._schedules.asReadonly();

  totalLoan = computed(() =>
    this._schedules().reduce((s, i) => s + i.amountDue, 0));
  totalPaid = computed(() =>
    this._schedules().filter(i => i.status === 'PAID').reduce((s, i) => s + i.amountDue, 0));
  loanRemaining = computed(() =>
    Math.max(0, this.totalLoan() - this.totalPaid()));
  repaymentProgress = computed(() =>
    this.totalLoan() > 0 ? Math.min(100, (this.totalPaid() / this.totalLoan()) * 100) : 0);

  nextInstallment = computed(() => {
    const pending = this._schedules()
      .filter(s => s.status === 'PENDING' || s.status === 'OVERDUE')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return pending[0] ?? null;
  });

  // ── Transaction state ─────────────────────────────────────────────
  private _transactions = signal<Transaction[]>([]);
  transactions           = this._transactions.asReadonly();

  // ── Modal / action state ──────────────────────────────────────────
  successMsg = '';
  errorMsg   = '';

  showConfirm   = false;
  pendingId     = 0;
  pendingAmount = 0;
  paying        = false;
  payingId: number | null = null;

  showModal   = false;
  modalMode: 'deposit' | 'withdraw' = 'deposit';
  modalAmount = 0;
  modalBusy   = false;

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loadAccount();
    this.loadSchedules();
    this.loadTransactions();
  }

  private loadAccount() {
    this.loadingAccount.set(true);
    this.accountService.getMyCustomerAccounts()
      .pipe(finalize(() => this.loadingAccount.set(false)))
      .subscribe({
        next: (response: any) => {
          // Backend returns List<CustomerAccountResponse> — handle both array and single object
          const list: any[] = Array.isArray(response) ? response : (response ? [response] : []);
          const acc = list[0];
          if (acc) {
            this.accountNumber  = acc.accountNumber  ?? '';
            this.accountBalance.set(Number(acc.currentBalance ?? 0));
          } else {
            this.errorMsg = 'No account found. Please contact support.';
          }
        },
        error: (err: any) => {
          console.error('Error loading account:', err);
          this.errorMsg = err?.error?.error
            || err?.error?.message
            || err?.message
            || 'Failed to load account. Please try again.';
        }
      });
  }

  private loadSchedules() {
    this.loadingSchedules = true;
    this.repaymentService.getCustomerRepayments().subscribe({
      next:  (s) => { this._schedules.set(s || []); this.loadingSchedules = false; },
      error: ()  => { this._schedules.set([]);       this.loadingSchedules = false; }
    });
  }

  private loadTransactions() {
    this.transactionService.getMyTransactions().subscribe({
      next: (txs) => {
        this._transactions.set((txs || []).map((t: any) => {
          // Safe-guard date parsing: transactionDate may be null for legacy records
          let dateStr = '—';
          try {
            if (t.transactionDate) {
              dateStr = new Date(t.transactionDate).toLocaleDateString();
            }
          } catch {
            dateStr = String(t.transactionDate ?? '—');
          }
          return {
            date:         dateStr,
            description:  t.description || '—',
            amount:       Number(t.amount ?? 0),
            type:         t.transactionType || '',
            balanceAfter: Number(t.balanceAfter ?? 0)
          };
        }));
      },
      error: () => this._transactions.set([])
    });
  }

  // ── Pay confirmation ──────────────────────────────────────────────
  openConfirm(id: number, amount: number) {
    this.pendingId = id; this.pendingAmount = amount;
    this.successMsg = ''; this.errorMsg = '';
    this.showConfirm = true;
  }

  confirmPayment() {
    this.paying    = true;
    this.payingId  = this.pendingId;
    this.repaymentService.payRepayment({
      repaymentId:   this.pendingId,
      amount:        this.pendingAmount,
      paymentMethod: 'ACCOUNT_TRANSFER'
    }).pipe(finalize(() => { this.paying = false; this.payingId = null; this.showConfirm = false; }))
      .subscribe({
        next: () => {
          this.successMsg = `Payment of ${this.pendingAmount.toLocaleString()} ETB successful!`;
          setTimeout(() => this.successMsg = '', 6000);
          this.loadAll();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || err.error?.message || 'Payment failed.';
          setTimeout(() => this.errorMsg = '', 8000);
        }
      });
  }

  // ── Deposit / Withdraw modal ──────────────────────────────────────
  openModal(mode: 'deposit' | 'withdraw') {
    this.modalMode = mode; this.modalAmount = 0;
    this.successMsg = ''; this.errorMsg = '';
    this.showModal = true;
  }

  confirmModal() {
    if (this.modalAmount <= 0) return;
    this.modalBusy = true;

    const obs = this.modalMode === 'deposit'
      ? this.accountService.depositToRepaymentAccount(this.modalAmount)
      : this.accountService.withdrawFromAccount(this.modalAmount);

    obs.pipe(finalize(() => this.modalBusy = false)).subscribe({
      next: (resp) => {
        this.showModal  = false;
        this.modalAmount = 0;
        const action = this.modalMode === 'deposit' ? 'Deposit' : 'Withdrawal';
        this.successMsg = `${action} of ${resp.currentBalance !== undefined
          ? '' : ''}${this.modalAmount.toLocaleString()} ETB processed!`;
        this.accountBalance.set(Number(resp.currentBalance ?? this.accountBalance()));
        setTimeout(() => this.successMsg = '', 6000);
        this.loadTransactions();
      },
      error: (err) => {
        this.errorMsg = err.error?.error || err.error?.message || `${this.modalMode} failed.`;
        setTimeout(() => this.errorMsg = '', 8000);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  statusBg(s: string): string {
    if (s === 'PAID') return '#d4edda';
    if (s === 'OVERDUE') return '#f8d7da';
    return '#fff3cd';
  }
  statusColor(s: string): string {
    if (s === 'PAID') return '#155724';
    if (s === 'OVERDUE') return '#721c24';
    return '#856404';
  }

  isCreditType(type: string): boolean {
    return type === 'LOAN_DISBURSEMENT' || type === 'CUSTOMER_DEPOSIT';
  }
  txTypeLabel(type: string): string {
    const m: Record<string, string> = {
      LOAN_DISBURSEMENT:   'Disbursement',
      LOAN_REPAYMENT:      'Repayment',
      CUSTOMER_DEPOSIT:    'Deposit',
      CUSTOMER_WITHDRAWAL: 'Withdrawal',
      ACCOUNT_ADJUSTMENT:  'Adjustment'
    };
    return m[type] ?? type;
  }
  txTypeBg(type: string): string {
    if (type === 'LOAN_DISBURSEMENT' || type === 'CUSTOMER_DEPOSIT') return '#d4edda';
    if (type === 'LOAN_REPAYMENT'    || type === 'CUSTOMER_WITHDRAWAL') return '#f8d7da';
    return '#e9ecef';
  }
  txTypeColor(type: string): string {
    if (type === 'LOAN_DISBURSEMENT' || type === 'CUSTOMER_DEPOSIT') return '#155724';
    if (type === 'LOAN_REPAYMENT'    || type === 'CUSTOMER_WITHDRAWAL') return '#721c24';
    return '#495057';
  }
}
