import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBanks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/banks`);
  }

  getBankById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/banks/${id}`);
  }

  createBank(bankData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/banks`, bankData);
  }

  updateBank(id: number, bankData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/banks/${id}`, bankData);
  }

  deleteBank(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/banks/${id}`);
  }

  // ── Loan Accounts ──────────────────────────────────────────────────────────

  getAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/accounts`);
  }

  getAccountById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/accounts/${id}`);
  }

  updateAccountBalance(id: number, newBalance: number, remarks: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/accounts/${id}/balance`, {
      newBalance,
      remarks
    });
  }
}
