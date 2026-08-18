import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/accounts`);
  }

  getAccountById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/accounts/${id}`);
  }

  createAccount(accountData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/accounts`, accountData);
  }

  updateAccount(id: number, accountData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/accounts/${id}`, accountData);
  }

  deleteAccount(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/accounts/${id}`);
  }

  getAccountByLoanType(loanType: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/accounts/loan-type/${loanType}`);
  }

  getMyCustomerAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/customer-accounts/my-accounts`);
  }

  depositToRepaymentAccount(amount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/customer-accounts/deposit`, { amount });
  }

  withdrawFromAccount(amount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/customer-accounts/withdraw`, { amount });
  }
}
