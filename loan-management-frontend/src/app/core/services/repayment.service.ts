import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
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
  remainingBalance: number;
  paymentMethod: string | null;
  status: string;
  remarks: string | null;
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

  getRepayments(): Observable<RepaymentResponse[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/repayment-schedules`).pipe(
      map(schedules => this.mapSchedulesToRepayments(schedules))
    );
  }

  getRepaymentById(id: number): Observable<RepaymentResponse> {
    return this.http.get<any>(`${this.apiUrl}/api/repayment-schedules/${id}`).pipe(
      map(schedule => this.mapScheduleToRepayment(schedule))
    );
  }

  getRepaymentsByLoan(loanId: number): Observable<RepaymentResponse[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/repayment-schedules/loan-application/${loanId}`).pipe(
      map(schedules => this.mapSchedulesToRepayments(schedules))
    );
  }

  getCustomerRepayments(): Observable<RepaymentResponse[]> {
    // Fetches all repayment schedules. The backend /api/repayment-schedules
    // endpoint returns only schedules belonging to the authenticated user's
    // loans (filtered server-side via the JWT context).
    return this.http.get<any[]>(`${this.apiUrl}/api/repayment-schedules`).pipe(
      map(schedules => this.mapSchedulesToRepayments(schedules))
    );
  }

  payRepayment(request: RepaymentRequest): Observable<RepaymentResponse> {
    // Simulate payment - in real implementation, this would call a backend endpoint
    return this.http.post<any>(`${this.apiUrl}/api/repayment-schedules/${request.repaymentId}/pay`, request).pipe(
      map(schedule => this.mapScheduleToRepayment(schedule))
    );
  }

  updateRepayment(id: number, request: Partial<RepaymentRequest>): Observable<RepaymentResponse> {
    return this.http.put<any>(`${this.apiUrl}/api/repayment-schedules/${id}`, request).pipe(
      map(schedule => this.mapScheduleToRepayment(schedule))
    );
  }

  getRepaymentStats(): Observable<any> {
    // Calculate stats from all schedules
    return this.http.get<any[]>(`${this.apiUrl}/api/repayment-schedules`).pipe(
      map(schedules => {
        const totalPaid = schedules
          .filter(s => s.status === 'PAID')
          .reduce((sum, s) => sum + (s.totalPayment || 0), 0);
        
        const remainingBalance = schedules
          .filter(s => s.status !== 'PAID')
          .reduce((sum, s) => sum + (s.remainingBalance || 0), 0);
        
        const overdueInstallments = schedules.filter(s => 
          s.status === 'PENDING' && new Date(s.dueDate) < new Date()
        ).length;
        
        const totalInstallments = schedules.length;
        const paidInstallments = schedules.filter(s => s.status === 'PAID').length;
        const repaymentProgress = totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;
        
        return {
          totalPaid,
          remainingBalance,
          overdueInstallments,
          upcomingInstallments: schedules.filter(s => s.status === 'PENDING').length,
          completedLoans: 0, // Would need loan-level status
          repaymentProgress
        };
      })
    );
  }

  private mapSchedulesToRepayments(schedules: any[]): RepaymentResponse[] {
    return schedules.map(schedule => this.mapScheduleToRepayment(schedule));
  }

  private mapScheduleToRepayment(schedule: any): RepaymentResponse {
    return {
      id: schedule.id,
      loanId: schedule.loanApplication?.id || 0,
      loanApplicationNumber: schedule.loanApplication?.applicationNumber || `APP-${schedule.loanApplication?.id}`,
      installmentNumber: schedule.installmentNumber,
      dueDate: schedule.dueDate,
      paymentDate: schedule.paidDate || null,
      amountDue: schedule.totalPayment || 0,
      amountPaid: schedule.status === 'PAID' ? (schedule.totalPayment || 0) : 0,
      remainingBalance: schedule.remainingBalance || 0,
      paymentMethod: null,
      status: schedule.status || 'PENDING',
      remarks: null
    };
  }
}
