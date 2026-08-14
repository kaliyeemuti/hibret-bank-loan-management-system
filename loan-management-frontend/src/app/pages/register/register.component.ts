import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/** Custom validator: exactly 13 numeric digits */
function exactlyThirteenDigits(control: AbstractControl): ValidationErrors | null {
  const val = (control.value || '').toString().trim();
  return /^\d{13}$/.test(val) ? null : { accountNumberInvalid: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card register-card">

        <!-- ── Success state ────────────────────────────────────────── -->
        <div *ngIf="success" class="auth-header">
          <div style="font-size:40px;color:var(--success);text-align:center;margin-bottom:15px;">✓</div>
          <h1>Registration Successful!</h1>
          <p>Your account has been created. Redirecting to login…</p>
        </div>

        <!-- ── Registration form ─────────────────────────────────────── -->
        <div *ngIf="!success">
          <div class="auth-header">
            <div class="auth-logo">🏦</div>
            <h1>Create Account</h1>
            <p>Join Hibret Smart Loans</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="handleSubmit()" class="auth-form">
            <div *ngIf="error" class="error-message">{{ error }}</div>

            <!-- Full Name -->
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input type="text" id="fullName" formControlName="fullName"
                     placeholder="Enter your full name" />
              <div *ngIf="registerForm.get('fullName')?.touched && registerForm.get('fullName')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Full name is required.
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" formControlName="email"
                     placeholder="Enter your email" />
              <div *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Please enter a valid email.
              </div>
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" formControlName="phone"
                     placeholder="Enter your phone number" />
              <div *ngIf="registerForm.get('phone')?.touched && registerForm.get('phone')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Phone number is required.
              </div>
            </div>

            <!-- Account Number -->
            <div class="form-group">
              <label for="accountNumber">Account Number</label>
              <input type="text" id="accountNumber" formControlName="accountNumber"
                     placeholder="Enter your 13-digit account number"
                     maxlength="13" inputmode="numeric" />
              <div *ngIf="registerForm.get('accountNumber')?.touched"
                   style="font-size:12px;margin-top:4px;">
                <span *ngIf="registerForm.get('accountNumber')?.errors?.['required']"
                      style="color:var(--danger);">
                  Account number is required.
                </span>
                <span *ngIf="registerForm.get('accountNumber')?.errors?.['accountNumberInvalid']"
                      style="color:var(--danger);">
                  Must be exactly 13 digits (numbers only, no spaces or letters).
                </span>
              </div>
              <small style="color:var(--text-dark);opacity:.6;font-size:11px;margin-top:3px;display:block;">
                Exactly 13 numeric digits (e.g. 1000123456789)
              </small>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" formControlName="password"
                     placeholder="Enter a password" />
              <div *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Password must be at least 6 characters.
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" formControlName="confirmPassword"
                     placeholder="Confirm your password" />
              <div *ngIf="registerForm.get('confirmPassword')?.touched && registerForm.get('confirmPassword')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Confirm password is required.
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-large btn-full"
                    [disabled]="loading">
              {{ loading ? 'Creating Account…' : 'Create Account' }}
            </button>
          </form>

          <div class="auth-footer">
            <p>Already have an account? <a routerLink="/login">Login here</a></p>
          </div>
        </div>

      </div>
    </div>
  `
})
export class RegisterComponent {
  fb          = inject(FormBuilder);
  authService = inject(AuthService);
  router      = inject(Router);

  registerForm = this.fb.group({
    fullName:        ['', [Validators.required]],
    email:           ['', [Validators.required, Validators.email]],
    phone:           ['', [Validators.required]],
    accountNumber:   ['', [Validators.required, exactlyThirteenDigits]],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  error   = '';
  success = false;
  loading = false;

  handleSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { fullName, email, phone, accountNumber, password, confirmPassword } =
      this.registerForm.value;

    if (password !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.error   = '';
    this.loading = true;

    const nameParts = (fullName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || 'Customer';
    const username  = (email || '').split('@')[0] + Math.floor(Math.random() * 1000);

    const payload = {
      firstName,
      lastName,
      username,
      email,
      phoneNumber:   phone,
      accountNumber: (accountNumber || '').trim(),
      password,
      role: 'CUSTOMER'
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.message || err.message || 'Registration failed.';
      }
    });
  }
}
