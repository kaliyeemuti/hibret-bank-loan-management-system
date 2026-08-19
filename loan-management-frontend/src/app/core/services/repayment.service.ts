import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RepaymentResponse {
  id: number;
  loanId: number;
  loanApplicationNumber: string;
  installmentNumber: number;
  dueDate: string;
  paymentDate: string | null;
  amountDue: number;
  amountPaid: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
  paymentMethod: string | null;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';
  remarks: string | null;
  interestRate: number | null;
}

export interface RepaymentRequest {
  repaymentId: number;
  amount: number;
  paymentMethod: string;
  remarks?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RepaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Returns all repayment schedule installments for the authenticated customer.
   * Uses the customer-scoped /my-schedules endpoint to prevent data leakage.
   */
  getCustomerRepayments(): Observable<RepaymentResponse[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/repayment-schedules/my-schedules`).pipe(
      map(schedules => schedules.map(s => this.mapScheduleToRepayment(s)))
    );
  }

  getRepaymentsByLoan(loanId: number): Observable<RepaymentResponse[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/repayment-schedules/loan-application/${loanId}`).pipe(
      map(schedules => schedules.map(s => this.mapScheduleToRepayment(s)))
    );
  }

  /**
   * Pay a specific installment by its ID.
   * The backend uses the installment's own totalPayment as the amount.
   */
  payRepayment(request: RepaymentRequest): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/repayment-schedules/${request.repaymentId}/pay`,
      {
        amount: request.amount,
        paymentMethod: request.paymentMethod,
        remarks: request.remarks
      }
    );
  }

  getRepaymentStats(): Observable<any> {
    return this.getCustomerRepayments().pipe(
      map(schedules => {
        const totalPaid = schedules
          .filter(s => s.status === 'PAID')
          .reduce((sum, s) => sum + s.amountDue, 0);
        const remainingBalance = schedules
          .filter(s => s.status !== 'PAID')
          .reduce((sum, s) => sum + s.remainingBalance, 0);
        const totalInstallments = schedules.length;
        const paidInstallments = schedules.filter(s => s.status === 'PAID').length;
        const repaymentProgress = totalInstallments > 0
          ? Math.round((paidInstallments / totalInstallments) * 100)
          : 0;
        return {
          totalPaid,
          remainingBalance,
          overdueInstallments: schedules.filter(s => s.status === 'OVERDUE').length,
          upcomingInstallments: schedules.filter(s => s.status === 'PENDING').length,
          completedLoans: 0,
          repaymentProgress
        };
      })
    );
  }

  /**
   * Computes repayment statistics from an already-loaded list of schedules.
   * Used by the Admin Transactions page, which fetches schedules via the
   * per-loan admin endpoint (not the customer-scoped /my-schedules endpoint).
   * This ensures the admin sees system-wide stats, not their own (empty) data.
   */
  computeStatsFromSchedules(schedules: RepaymentResponse[]): {
    totalPaid: number;
    remainingBalance: number;
    overdueInstallments: number;
    upcomingInstallments: number;
    repaymentProgress: number;
  } {
    const totalPaid = schedules
      .filter(s => s.status === 'PAID')
      .reduce((sum, s) => sum + s.amountDue, 0);
    const remainingBalance = schedules
      .filter(s => s.status !== 'PAID')
      .reduce((sum, s) => sum + s.remainingBalance, 0);
    const totalInstallments = schedules.length;
    const paidInstallments = schedules.filter(s => s.status === 'PAID').length;
    const repaymentProgress = totalInstallments > 0
      ? Math.round((paidInstallments / totalInstallments) * 100)
      : 0;
    return {
      totalPaid,
      remainingBalance,
      overdueInstallments: schedules.filter(s => s.status === 'OVERDUE').length,
      upcomingInstallments: schedules.filter(s => s.status === 'PENDING').length,
      repaymentProgress
    };
  }

  private mapScheduleToRepayment(s: any): RepaymentResponse {
    // The /my-schedules endpoint returns RepaymentScheduleResponse DTO fields.
    // loanApplicationId and loanApplicationNumber come directly.
    return {
      id: s.id,
      loanId: s.loanApplicationId || 0,
      loanApplicationNumber: s.loanApplicationNumber || `APP-${s.loanApplicationId}`,
      installmentNumber: s.installmentNumber,
      dueDate: s.dueDate,
      paymentDate: s.paidDate || null,
      amountDue: s.totalPayment || 0,
      amountPaid: s.status === 'PAID' ? (s.totalPayment || 0) : 0,
      principalAmount: s.principalAmount || 0,
      interestAmount: s.interestAmount || 0,
      remainingBalance: s.remainingBalance || 0,
      paymentMethod: null,
      status: s.status || 'PENDING',
      remarks: null,
      interestRate: s.interestRate || null
    };
  }
}
