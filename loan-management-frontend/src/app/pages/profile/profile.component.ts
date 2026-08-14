import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/loan.service';
import { BackButtonComponent } from '../../components/back-button/back-button.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="profile-wrapper">
      <app-back-button></app-back-button>
      <div class="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information</p>
      </div>

      <div class="profile-container">
        <div class="profile-card">
          <div *ngIf="loading()" class="empty-state"><p>Loading profile…</p></div>
          <div *ngIf="loadError()" class="error-message">{{ loadError() }}</div>

          <ng-container *ngIf="!loading()">
            <div *ngIf="success" class="success-message">Profile updated successfully!</div>
            <div *ngIf="saveError" class="error-message">{{ saveError }}</div>

            <div class="profile-picture">
              <div class="avatar-large">{{ avatarChar() }}</div>
              <button *ngIf="isEditing" class="change-picture-btn">Change Picture</button>
            </div>

            <div class="profile-form">

              <!-- Full Name -->
              <div class="form-group">
                <label>Full Name</label>
                <input *ngIf="isEditing; else showFullName"
                       type="text" [(ngModel)]="formData.fullName" />
                <ng-template #showFullName>
                  <p class="form-value">{{ formData.fullName || 'N/A' }}</p>
                </ng-template>
              </div>

              <!-- Email (read-only) -->
              <div class="form-group">
                <label>Email Address</label>
                <p class="form-value">{{ formData.email }}</p>
              </div>

              <!-- Username (read-only) -->
              <div class="form-group">
                <label>Username</label>
                <p class="form-value">{{ formData.username || 'N/A' }}</p>
              </div>

              <!-- Phone Number -->
              <div class="form-group">
                <label>Phone Number</label>
                <input *ngIf="isEditing; else showPhone"
                       type="tel" [(ngModel)]="formData.phoneNumber" />
                <ng-template #showPhone>
                  <p class="form-value">{{ formData.phoneNumber || 'N/A' }}</p>
                </ng-template>
              </div>

              <!-- Account Number -->
              <div class="form-group">
                <label>Account Number</label>
                <ng-container *ngIf="isEditing; else showAccountNumber">
                  <input type="text"
                         [(ngModel)]="formData.accountNumber"
                         maxlength="13"
                         placeholder="13-digit account number"
                         inputmode="numeric" />
                  <small style="color:var(--text-dark);opacity:.6;
                                font-size:12px;margin-top:4px;display:block;">
                    Must be exactly 13 digits (numbers only).
                  </small>
                </ng-container>
                <ng-template #showAccountNumber>
                  <p class="form-value"
                     style="font-family:monospace;letter-spacing:0.05em;">
                    {{ formData.accountNumber || 'N/A' }}
                  </p>
                </ng-template>
              </div>

              <!-- Role (read-only) -->
              <div class="form-group">
                <label>Role</label>
                <p class="form-value">{{ formData.role?.replace('_', ' ') }}</p>
              </div>

              <!-- Action buttons -->
              <div class="form-actions">
                <button *ngIf="!isEditing"
                        type="button" class="btn btn-primary btn-large"
                        (click)="handleEdit()">
                  Edit Profile
                </button>
                <ng-container *ngIf="isEditing">
                  <button type="button" class="btn btn-primary btn-large"
                          [disabled]="saving" (click)="handleSave()">
                    {{ saving ? 'Saving…' : 'Save Changes' }}
                  </button>
                  <button type="button" class="btn btn-outline btn-large"
                          (click)="handleCancel()" style="margin-left:8px;">
                    Cancel
                  </button>
                </ng-container>
              </div>
            </div>

            <!-- Account info panel -->
            <div class="profile-stats">
              <h3>Account Information</h3>
              <div class="stats-item">
                <span>Account Status:</span>
                <span class="status-active">{{ formData.status || 'Active' }}</span>
              </div>
              <div class="stats-item">
                <span>Member Since:</span>
                <span>{{ formData.createdAt ? (formData.createdAt | date:'mediumDate') : 'N/A' }}</span>
              </div>
              <div class="stats-item" *ngIf="formData.eligibilityStatus">
                <span>Eligibility:</span>
                <span>{{ formData.eligibilityStatus.replace('_', ' ') }}</span>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  loanService = inject(LoanService);

  currentUser = this.authService.currentUser;
  loading     = signal(true);
  loadError   = signal('');

  isEditing = false;
  success   = false;
  saveError = '';
  saving    = false;

  formData: any = {
    id: null, fullName: '', email: '', username: '',
    phoneNumber: '', role: '', status: '',
    createdAt: null, eligibilityStatus: '', accountNumber: ''
  };

  avatarChar() {
    return this.formData.fullName?.charAt(0)?.toUpperCase() || 'U';
  }

  ngOnInit() {
    const user = this.currentUser();
    if (user?.id) {
      this.loadFromApi(user.id);
    } else {
      this.formData = {
        id: null,
        fullName:         user?.fullName    || '',
        email:            user?.email       || '',
        username:         user?.username    || '',
        phoneNumber:      user?.phoneNumber || '',
        role:             user?.role        || '',
        status:           'Active',
        createdAt:        null,
        eligibilityStatus: '',
        accountNumber:    ''
      };
      this.loading.set(false);
    }
  }

  private loadFromApi(id: number) {
    this.loanService.getUserById(id).subscribe({
      next: (data: any) => {
        this.formData = {
          id:               data.id,
          fullName:         data.firstName && data.lastName
                              ? `${data.firstName} ${data.lastName}`
                              : (data.fullName || ''),
          email:            data.email            || '',
          username:         data.username         || '',
          phoneNumber:      data.phoneNumber || data.phone || '',
          role:             data.role              || '',
          status:           data.status            || 'ACTIVE',
          createdAt:        data.createdAt         || null,
          eligibilityStatus: data.eligibilityStatus || '',
          // Use the real value from the backend — never fall back to a mock
          accountNumber:    data.accountNumber     || ''
        };
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.loadError.set('Failed to load profile data.');
        this.loading.set(false);
      }
    });
  }

  handleEdit() {
    this.isEditing = true;
    this.saveError = '';
    this.success   = false;
  }

  handleCancel() {
    this.isEditing = false;
    this.saveError = '';
    const user = this.currentUser();
    if (user?.id) {
      this.loadFromApi(user.id);
    }
  }

  handleSave() {
    // ── Client-side validation ────────────────────────────────────────
    if (!this.formData.fullName?.trim()) {
      this.saveError = 'Full name is required.';
      return;
    }

    const accNum = (this.formData.accountNumber || '').trim();
    if (!accNum) {
      this.saveError = 'Account number is required.';
      return;
    }
    if (!/^\d{13}$/.test(accNum)) {
      this.saveError = 'Account number must be exactly 13 digits (numbers only).';
      return;
    }

    this.saving    = true;
    this.saveError = '';

    const id = this.formData.id || this.currentUser()?.id;

    // No id — update session only (shouldn't normally happen)
    if (!id) {
      this.authService.updateProfile({ fullName: this.formData.fullName });
      this.success   = true;
      this.isEditing = false;
      this.saving    = false;
      setTimeout(() => this.success = false, 3000);
      return;
    }

    const nameParts = this.formData.fullName.trim().split(/\s+/);
    const payload = {
      firstName:         nameParts[0] || '',
      lastName:          nameParts.slice(1).join(' ') || '',
      phoneNumber:       this.formData.phoneNumber,
      email:             this.formData.email,
      role:              this.formData.role,
      eligibilityStatus: this.formData.eligibilityStatus || undefined,
      accountNumber:     accNum          // ← include real account number
    };

    this.loanService.updateUser(id, payload).subscribe({
      next: (updated: any) => {
        this.saving    = false;
        this.isEditing = false;
        this.success   = true;

        const fullName = updated.firstName && updated.lastName
          ? `${updated.firstName} ${updated.lastName}`
          : this.formData.fullName;

        this.authService.updateProfile({
          fullName,
          phoneNumber: updated.phoneNumber
        });

        this.formData.fullName     = fullName;
        this.formData.phoneNumber  = updated.phoneNumber  || this.formData.phoneNumber;
        this.formData.accountNumber = updated.accountNumber || accNum;

        setTimeout(() => this.success = false, 3000);
      },
      error: (err) => {
        this.saving    = false;
        this.saveError = err.error?.message || 'Failed to save profile changes.';
      }
    });
  }
}
