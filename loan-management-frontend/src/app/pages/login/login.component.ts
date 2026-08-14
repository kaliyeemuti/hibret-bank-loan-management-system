import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styles: `
    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input-wrapper input {
      flex: 1;
      padding-right: 40px;
    }

    .toggle-password {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .toggle-password:hover {
      opacity: 1;
    }
  `,
  template: `
    <div class="auth-container">
      <div class="auth-card login-card">
        <div class="auth-header">
          <div class="auth-logo">🏦</div>
          <h1>Smart Loan Management</h1>
          <p>Login to your account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="handleSubmit()" class="auth-form">
          <div *ngIf="error" class="error-message">{{ error }}</div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="Enter your email"
              [class.error]="loginForm.get('email')?.touched && loginForm.get('email')?.invalid"
            />
            <div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.hasError('required')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              Email is required.
            </div>
            <div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.hasError('email')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              Please enter a valid email address.
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input-wrapper">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                formControlName="password"
                placeholder="Enter your password"
                [class.error]="loginForm.get('password')?.touched && loginForm.get('password')?.invalid"
              />
              <button type="button" class="toggle-password" (click)="togglePasswordVisibility()">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.hasError('required')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              Password is required.
            </div>
          </div>

          <a routerLink="/forgot-password" class="forgot-password">
            Forgot Password?
          </a>

          <button
            type="submit"
            class="btn btn-primary btn-large btn-full"
            [disabled]="loading"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register">Register here</a></p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  error: string = '';
  loading: boolean = false;
  showPassword: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private getDashboardPath(role?: string | null): string {
    if (!role) {
      return '/dashboard';
    }

    return `/${role.toLowerCase().replace('_', '-')}/dashboard`;
  }

  private getErrorMessage(err: any): string {
    if (err?.status === 0) {
      return 'Network error. Please check your connection and try again.';
    }

    if (err?.status === 401) {
      return 'Invalid email or password. Please try again.';
    }

    if (err?.status === 403) {
      return 'Your account has been disabled. Please contact support.';
    }

    if (err?.status === 500) {
      return 'Server error. Please try again later.';
    }

    return err?.error?.message || err?.error?.error || err?.message || 'An error occurred. Please try again.';
  }

  handleSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.error = '';
    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          const currentUser = this.authService.currentUser();
          this.router.navigate([this.getDashboardPath(currentUser?.role)]);
        },
        error: (err) => {
          this.error = this.getErrorMessage(err);
        }
      });
  }
}
