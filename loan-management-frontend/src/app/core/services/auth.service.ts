import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface User {
  id?: number;
  email: string;
  role: string;
  username: string;
  fullName: string;
  phoneNumber?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  currentUser = signal<User | null>(null);
  isLoggedIn = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadSession();
  }

  private loadSession() {
    if (typeof window !== 'undefined') {
      const storedUser = sessionStorage.getItem('currentUser');
      const storedToken = sessionStorage.getItem('token');
      if (storedUser && storedToken) {
        try {
          this.currentUser.set(JSON.parse(storedUser));
          this.isLoggedIn.set(true);
        } catch (e) {
          this.logout();
        }
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/login`, { email, password }).pipe(
      tap(data => {
        if (data && data.token) {
          sessionStorage.setItem('token', data.token);
          const user: User = {
            id: data.id,
            email: data.email,
            role: data.role,
            username: data.username,
            fullName: data.fullName
          };
          sessionStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUser.set(user);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/register`, userData);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/reset-password`, { token, newPassword });
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('currentUser');
      // Also clear any legacy localStorage tokens from previous code versions
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }

  checkLoggedIn(): boolean {
    return this.isLoggedIn();
  }

  updateProfile(updatedData: Partial<User>): void {
    const current = this.currentUser();
    if (current) {
      const updated = { ...current, ...updatedData };
      this.currentUser.set(updated);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('currentUser', JSON.stringify(updated));
      }
    }
  }
}
