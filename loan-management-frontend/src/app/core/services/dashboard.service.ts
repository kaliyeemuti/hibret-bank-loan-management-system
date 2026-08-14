import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAdminDashboardStats(filters?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/dashboard/admin`, { params: this.cleanFilters(filters) });
  }

  getCustomerDashboardStats(filters?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/dashboard/customer`, { params: this.cleanFilters(filters) });
  }

  getLoanOfficerDashboardStats(filters?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/dashboard/loan-officer`, { params: this.cleanFilters(filters) });
  }

  getManagerDashboardStats(filters?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/dashboard/manager`, { params: this.cleanFilters(filters) });
  }

  getBankStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/dashboard/bank`);
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
