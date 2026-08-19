import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Health check
  checkHealth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/health`);
  }

  // Loan Products (Types)
  getLoanProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/loan-products/active`);
  }

  createLoanProduct(productData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/loan-products`, productData);
  }

  deleteLoanProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/loan-products/${id}`);
  }

  // Loan Applications
  getLoanApplications(type?: string): Observable<any[]> {
    const params: { [param: string]: string } = {};
    if (type) {
      params['type'] = type;
    }
    return this.http.get<any[]>(`${this.apiUrl}/api/loan-applications`, { params });
  }

  getLoanApplicationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/loan-applications/${id}`);
  }

  applyForLoan(applicationData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/loan-applications`, applicationData);
  }

  deleteLoanApplication(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/loan-applications/${id}`);
  }

  submitApplication(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/loan-applications/${id}/submit`, {});
  }

  updateApplication(id: number, applicationData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/loan-applications/${id}`, applicationData);
  }

  getApplicationHistory(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/loan-applications/${id}/history`);
  }

  // Businesses
  getBusinesses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/businesses`);
  }

  // Loan Reviews
  getLoanReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/reviews`);
  }

  submitReview(reviewData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/reviews`, reviewData);
  }

  submitOfficerReview(reviewData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/reviews/officer`, reviewData);
  }

  submitManagerReview(reviewData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/reviews/manager`, reviewData);
  }

  getReviewsByApplication(applicationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/reviews/application/${applicationId}`);
  }

  // User Management
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/users`);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/users/${id}`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/users/${id}`);
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/users/${id}`, userData);
  }

  updateEligibility(id: number, eligibilityStatus: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/api/users/${id}/eligibility`, { eligibilityStatus });
  }

  // Repayment Schedules
  getRepaymentSchedule(loanApplicationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/repayment-schedules/loan-application/${loanApplicationId}`);
  }
}
