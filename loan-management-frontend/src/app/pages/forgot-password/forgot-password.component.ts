import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🔐</div>
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>

        <form [formGroup]="forgotForm" (ngSubmit)="handleSubmit()" class="auth-form">
          <div *ngIf="success" class="success-message">
            {{ success }}
          </div>
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="Enter your email"
              [disabled]="loading || !!success"
              [class.error]="forgotForm.get('email')?.touched && forgotForm.get('email')?.invalid"
            />
            <div *ngIf="forgotForm.get('email')?.touched && forgotForm.get('email')?.hasError('required')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              Email is required.
            </div>
            <div *ngIf="forgotForm.get('email')?.touched && forgotForm.get('email')?.hasError('email')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              Please enter a valid email address.
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-large btn-full"
            [disabled]="loading || !!success"
          >
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Remember your password? <a routerLink="/login">Back to Login</a></p>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  error: string = '';
  success: string = '';
  loading: boolean = false;

  handleSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.error = '';
    this.success = '';
    this.loading = true;
    const { email } = this.forgotForm.value;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'If an account exists with this email, you will receive a password reset link shortly. Please check your inbox.';
      },
      error: (err) => {
        this.loading = false;
        
        if (err.status === 0) {
          this.error = 'Network error. Please check your connection and try again.';
        } else if (err.status === 404) {
          // For security, still show success message even if email doesn't exist
          this.success = 'If an account exists with this email, you will receive a password reset link shortly. Please check your inbox.';
        } else if (err.status === 500) {
          this.error = 'Server error. Please try again later.';
        } else {
          this.error = err.error?.message || 'An error occurred. Please try again.';
        }
      }
    });
  }
}
