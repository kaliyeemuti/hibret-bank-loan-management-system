import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../../core/services/loan.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

interface User {
  id:                number;
  fullName:          string;
  email:             string;
  role:              string;
  phone:             string;
  status:            string;
  eligibilityStatus: string;
  accountNumber:     string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all system users</p>
        </div>
        <a routerLink="/admin/users/add" class="btn btn-primary">➕ Add User</a>
      </div>

      <div class="page-content">

        <div *ngIf="successMsg" class="success-message" style="margin-bottom:16px;">{{ successMsg }}</div>
        <div *ngIf="errorMsg"   class="error-message"   style="margin-bottom:16px;">{{ errorMsg }}</div>

        <div class="table-card">
          <div class="table-header">
            <input type="text" placeholder="Search by name or email..."
                   [(ngModel)]="searchTerm" class="search-input" />
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Account Number</th>
                  <th>Status</th>
                  <th>Eligibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers()">
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ user.fullName.charAt(0) }}</div>
                      <span>{{ user.fullName }}</span>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="role-badge">{{ user.role.replace('_', ' ') }}</span>
                  </td>
                  <td>{{ user.phone || 'N/A' }}</td>
                  <td>
                    <span *ngIf="user.role === 'CUSTOMER' && user.accountNumber"
                          style="font-family:monospace;font-size:13px;letter-spacing:.04em;">
                      {{ user.accountNumber }}
                    </span>
                    <span *ngIf="user.role === 'CUSTOMER' && !user.accountNumber"
                          style="opacity:.5;font-size:12px;">N/A</span>
                    <span *ngIf="user.role !== 'CUSTOMER'"
                          style="opacity:.4;font-size:12px;">—</span>
                  </td>
                  <td>
                    <span class="status-badge" [ngClass]="(user.status || 'active').toLowerCase()">
                      {{ user.status || 'Active' }}
                    </span>
                  </td>
                  <td>
                    <span
                      [style.background]="user.eligibilityStatus === 'NOT_ELIGIBLE' ? '#fde8e8' : '#d4edda'"
                      [style.color]="user.eligibilityStatus === 'NOT_ELIGIBLE' ? '#c0392b' : '#155724'"
                      style="padding:3px 10px;border-radius:12px;font-size:12px;
                             font-weight:600;white-space:nowrap;">
                      {{ user.eligibilityStatus === 'NOT_ELIGIBLE' ? 'NOT ELIGIBLE' : 'ELIGIBLE' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <a [routerLink]="['/admin/users/edit', user.id]" class="btn-small">Edit</a>

                      <button
                        *ngIf="user.role === 'CUSTOMER' && user.eligibilityStatus === 'NOT_ELIGIBLE'"
                        class="btn-small"
                        style="background:var(--success);color:white;border:none;cursor:pointer;"
                        [disabled]="eligibilityLoading === user.id"
                        (click)="makeEligible(user)">
                        {{ eligibilityLoading === user.id ? '…' : '✔ Make Eligible' }}
                      </button>

                      <button class="btn-small btn-danger" (click)="handleDelete(user.id)">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="filteredUsers().length === 0" class="empty-state">
            <p>No users found matching your search.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  loanService = inject(LoanService);

  users               = signal<User[]>([]);
  searchTerm          = '';
  selectedUser        = signal<User | null>(null);
  eligibilityLoading: number | null = null;
  successMsg = '';
  errorMsg   = '';

  filteredUsers = computed(() => {
    const term = this.searchTerm.toLowerCase();
    return this.users().filter(u =>
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loanService.getUsers().subscribe({
      next: (data) => {
        this.users.set((data || []).map((u: any) => ({
          id:                u.id,
          fullName:          u.firstName && u.lastName
                               ? `${u.firstName} ${u.lastName}`
                               : (u.fullName || u.username || 'User'),
          email:             u.email,
          role:              u.role,
          phone:             u.phoneNumber || u.phone || '',
          status:            u.status            || 'ACTIVE',
          eligibilityStatus: u.eligibilityStatus || 'ELIGIBLE',
          accountNumber:     u.accountNumber     || ''
        })));
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.users.set([]);
        this.errorMsg = 'Failed to load users.';
      }
    });
  }

  makeEligible(user: User) {
    if (!confirm(`Restore loan eligibility for ${user.fullName}?`)) return;

    this.successMsg         = '';
    this.errorMsg           = '';
    this.eligibilityLoading = user.id;

    this.loanService.updateEligibility(user.id, 'ELIGIBLE').subscribe({
      next: () => {
        this.eligibilityLoading = null;
        this.successMsg = `${user.fullName} is now ELIGIBLE for a new loan.`;
        this.users.update(prev =>
          prev.map(u => u.id === user.id ? { ...u, eligibilityStatus: 'ELIGIBLE' } : u)
        );
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: (err) => {
        this.eligibilityLoading = null;
        this.errorMsg = err.error?.message || 'Failed to update eligibility.';
      }
    });
  }

  handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.loanService.deleteUser(id).subscribe({
      next: () => this.users.update(prev => prev.filter(u => u.id !== id)),
      error: (err) => {
        console.error('Error deleting user:', err);
        alert(err.error?.message || 'Failed to delete user.');
      }
    });
  }
}
