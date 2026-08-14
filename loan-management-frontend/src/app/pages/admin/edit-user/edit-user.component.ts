import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>Edit User</h1>
          <p>Update user information</p>
        </div>
      </div>

      <div class="page-content">
        <div class="form-card">
          <div *ngIf="error" class="error-message">{{ error }}</div>

          <form [formGroup]="userForm" (ngSubmit)="handleSubmit()" class="form-layout">
            <div class="form-group">
              <label for="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                formControlName="fullName"
                placeholder="Enter full name"
              />
              <div *ngIf="userForm.get('fullName')?.touched && userForm.get('fullName')?.invalid" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
                Full name is required.
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email Address *</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                placeholder="Enter email address"
              />
            </div>

            <div class="form-group">
              <label for="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                formControlName="phone"
                placeholder="Enter phone number"
              />
              <div *ngIf="userForm.get('phone')?.touched && userForm.get('phone')?.invalid" class="validation-error" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
                Phone number is required.
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="role">Role *</label>
                <select id="role" formControlName="role">
                  <option value="ADMIN">Admin</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="LOAN_OFFICER">Loan Officer</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              <div class="form-group">
                <label for="status">Status *</label>
                <select id="status" formControlName="status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="eligibilityStatus">Eligibility Status *</label>
              <select id="eligibilityStatus" formControlName="eligibilityStatus">
                <option value="ELIGIBLE">Eligible</option>
                <option value="NOT_ELIGIBLE">Not Eligible</option>
              </select>
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-primary btn-large"
                [disabled]="loading"
              >
                {{ loading ? 'Updating...' : 'Update User' }}
              </button>
              <button
                type="button"
                class="btn btn-outline btn-large"
                (click)="handleCancel()"
                style="margin-left: 8px;"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class EditUserComponent implements OnInit {
  fb = inject(FormBuilder);
  loanService = inject(LoanService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  userId!: number;
  error = '';
  loading = false;

  userForm = this.fb.group({
    fullName: ['', [Validators.required]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    role: ['LOAN_OFFICER', [Validators.required]],
    status: ['Active', [Validators.required]],
    eligibilityStatus: ['ELIGIBLE', [Validators.required]]
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.userId = parseInt(idParam);
      this.loadUser();
    }
  }

  loadUser() {
    this.loanService.getUserById(this.userId).subscribe({
      next: (user) => {
        if (user) {
          this.userForm.patchValue({
            fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.fullName || user.username || ''),
            email: user.email,
            phone: user.phoneNumber || user.phone || '',
            role: user.role,
            status: user.status || 'Active',
            eligibilityStatus: user.eligibilityStatus || 'ELIGIBLE'
          });
        } else {
          this.error = 'User not found';
        }
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error = 'Failed to load user data';
      }
    });
  }

  handleSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const formData = this.userForm.getRawValue();
    const payload = {
      firstName: formData.fullName?.split(' ')[0] || '',
      lastName: formData.fullName?.split(' ').slice(1).join(' ') || '',
      phoneNumber: formData.phone,
      role: formData.role,
      eligibilityStatus: formData.eligibilityStatus
    };

    this.loanService.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.loading = false;
        this.error = 'Failed to update user';
      }
    });
  }

  handleCancel() {
    this.router.navigate(['/admin/users']);
  }
}
