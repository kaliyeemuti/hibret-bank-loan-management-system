import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🔑</div>
          <h1>Reset Password</h1>
          <p>Enter your new password below</p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="handleSubmit()" class="auth-form">
          <div *ngIf="success" class="success-message">
            {{ success }}
          </div>
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>

          <div class="form-group">
            <label for="newPassword">New Password</label>
            <div class="password-input-wrapper">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="newPassword"
                formControlName="newPassword"
                placeholder="Enter new password"
                [disabled]="loading || !!success"
                [class.error]="resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.invalid"
              />
              <button type="button" class="toggle-password" (click)="togglePasswordVisibility()">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div *ngIf="resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.hasError('required')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              New password is required.
            </div>
            <div *ngIf="resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.hasError('minlength')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              Password must be at least 6 characters.
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              formControlName="confirmPassword"
              placeholder="Confirm new password"
              [disabled]="loading || !!success"
              [class.error]="resetForm.get('confirmPassword')?.touched && resetForm.get('confirmPassword')?.invalid"
            />
            <div *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.get('confirmPassword')?.hasError('required')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              Please confirm your password.
            </div>
            <div *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.get('confirmPassword')?.hasError('mismatch')" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
              Passwords do not match.
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-large btn-full"
            [disabled]="loading || !!success"
          >
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Remember your password? <a routerLink="/login">Back to Login</a></p>
        </div>
      </div>
    </div>
  `,
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
  `
})
export class ResetPasswordComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  error: string = '';
  success: string = '';
  loading: boolean = false;
  showPassword: boolean = false;
  token: string = '';

  ngOnInit() {
    // Get token from query params
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    
    if (!this.token) {
      this.error = 'Invalid or missing reset token. Please request a new password reset link.';
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    form.get('confirmPassword')?.setErrors(null);
    return null;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  handleSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.error = 'Invalid or missing reset token. Please request a new password reset link.';
      return;
    }

    this.error = '';
    this.success = '';
    this.loading = true;
    const { newPassword } = this.resetForm.value;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Password reset successfully! Redirecting to login...';
        
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        
        if (err.status === 0) {
          this.error = 'Network error. Please check your connection and try again.';
        } else if (err.status === 400) {
          this.error = 'Invalid or expired reset token. Please request a new password reset link.';
        } else if (err.status === 500) {
          this.error = 'Server error. Please try again later.';
        } else {
          this.error = err.error?.message || 'An error occurred. Please try again.';
        }
      }
    });
  }
}
