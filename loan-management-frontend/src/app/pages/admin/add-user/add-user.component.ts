import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule,
         AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

/** Exactly 13 numeric digits */
function exactlyThirteenDigits(c: AbstractControl): ValidationErrors | null {
  const v = (c.value ?? '').toString().trim();
  return v === '' || /^\d{13}$/.test(v) ? null : { accountNumberInvalid: true };
}

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>Add New User</h1>
          <p>Create a new system user account</p>
        </div>
      </div>

      <div class="page-content">
        <div class="form-card">
          <div *ngIf="error" class="error-message" style="margin-bottom:16px;">{{ error }}</div>

          <form [formGroup]="userForm" (ngSubmit)="handleSubmit()" class="form-layout">

            <!-- Full Name -->
            <div class="form-group">
              <label for="fullName">Full Name *</label>
              <input type="text" id="fullName" formControlName="fullName"
                     placeholder="Enter full name" />
              <div *ngIf="userForm.get('fullName')?.touched && userForm.get('fullName')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Full name is required.
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email">Email Address *</label>
              <input type="email" id="email" formControlName="email"
                     placeholder="Enter email address" />
              <div *ngIf="userForm.get('email')?.touched && userForm.get('email')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Please enter a valid email.
              </div>
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label for="phone">Phone Number *</label>
              <input type="tel" id="phone" formControlName="phone"
                     placeholder="Enter phone number" />
              <div *ngIf="userForm.get('phone')?.touched && userForm.get('phone')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Phone number is required.
              </div>
            </div>

            <!-- Role -->
            <div class="form-group">
              <label for="role">Role *</label>
              <select id="role" formControlName="role" (change)="onRoleChange()">
                <option value="CUSTOMER">Customer</option>
                <option value="LOAN_OFFICER">Loan Officer</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <!-- Account Number — required only for CUSTOMER -->
            <div class="form-group" *ngIf="isCustomer()">
              <label for="accountNumber">
                Account Number *
                <span style="font-weight:400;font-size:12px;opacity:.6;margin-left:6px;">
                  (13 digits, numbers only)
                </span>
              </label>
              <input type="text" id="accountNumber" formControlName="accountNumber"
                     placeholder="e.g. 1000123456789"
                     maxlength="13" inputmode="numeric" />
              <div *ngIf="userForm.get('accountNumber')?.touched"
                   style="font-size:12px;margin-top:4px;">
                <span *ngIf="userForm.get('accountNumber')?.errors?.['required']"
                      style="color:var(--danger);">
                  Account number is required for customers.
                </span>
                <span *ngIf="userForm.get('accountNumber')?.errors?.['accountNumberInvalid']"
                      style="color:var(--danger);">
                  Must be exactly 13 digits (numbers only, no spaces or letters).
                </span>
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password">Password *</label>
              <input type="password" id="password" formControlName="password"
                     placeholder="Enter password" />
              <div *ngIf="userForm.get('password')?.touched && userForm.get('password')?.invalid"
                   class="validation-error"
                   style="color:var(--danger);font-size:12px;margin-top:4px;">
                Password must be at least 6 characters.
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-large" [disabled]="loading">
                {{ loading ? 'Creating…' : 'Create User' }}
              </button>
              <button type="button" class="btn btn-outline btn-large"
                      (click)="handleCancel()" style="margin-left:8px;">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class AddUserComponent {
  fb          = inject(FormBuilder);
  authService = inject(AuthService);
  router      = inject(Router);

  userForm = this.fb.group({
    fullName:      ['', [Validators.required]],
    email:         ['', [Validators.required, Validators.email]],
    phone:         ['', [Validators.required]],
    role:          ['LOAN_OFFICER', [Validators.required]],
    accountNumber: ['', [exactlyThirteenDigits]],   // required-ness set dynamically
    password:      ['', [Validators.required, Validators.minLength(6)]]
  });

  error   = '';
  loading = false;

  isCustomer(): boolean {
    return this.userForm.get('role')?.value === 'CUSTOMER';
  }

  onRoleChange(): void {
    const acctCtrl = this.userForm.get('accountNumber')!;
    if (this.isCustomer()) {
      acctCtrl.setValidators([Validators.required, exactlyThirteenDigits]);
    } else {
      acctCtrl.setValidators([exactlyThirteenDigits]);
      acctCtrl.setValue('');
    }
    acctCtrl.updateValueAndValidity();
  }

  handleSubmit() {
    // Re-run role-based validators before submit
    this.onRoleChange();

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.error   = '';
    this.loading = true;

    const { fullName, email, phone, role, accountNumber, password } =
      this.userForm.value;

    const nameParts = (fullName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || 'User';
    const username  = (email || '').split('@')[0] + Math.floor(Math.random() * 1000);

    const payload: any = {
      firstName,
      lastName,
      username,
      email,
      phoneNumber: phone,
      password,
      role
    };

    // Only include accountNumber for CUSTOMER
    if (role === 'CUSTOMER' && accountNumber) {
      payload.accountNumber = accountNumber.trim();
    }

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || err.error?.error
          || 'Failed to create user. Please try again.';
      }
    });
  }

  handleCancel() {
    this.router.navigate(['/admin/users']);
  }
}
