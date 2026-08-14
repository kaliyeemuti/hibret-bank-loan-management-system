import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLoanApplicationsReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/reports/loan-applications`);
  }

  getLoanProductsReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/reports/loan-products`);
  }

  getUsersReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/reports/users`);
  }

  getApprovalRatesReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/reports/approval-rates`);
  }

  getRevenueReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/reports/revenue`);
  }

  getReportData(filters?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/reports/data`, { params: this.cleanFilters(filters) });
  }

  exportReport(format: string, filters?: any): Observable<Blob> {
    const params = this.cleanFilters(filters);
    params['format'] = format;
    return this.http.get(`${this.apiUrl}/api/reports/export`, {
      params: params,
      responseType: 'blob'
    });
  }

  private cleanFilters(filters?: any): any {
    if (!filters) return {};
    const params: any = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params[key] = filters[key];
      }
    });
    return params;
  }
}
