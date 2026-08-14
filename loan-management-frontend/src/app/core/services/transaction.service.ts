import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/transactions`);
  }

  getTransactionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/transactions/${id}`);
  }

  getTransactionsByLoan(loanId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/transactions/loan/${loanId}`);
  }

  getTransactionsByAccount(accountId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/transactions/account/${accountId}`);
  }

  filterTransactions(start: string, end: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/transactions/filter`, {
      params: { start, end }
    });
  }

  getMyTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/transactions/my-history`);
  }
}
