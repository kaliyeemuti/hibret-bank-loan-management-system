import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NotificationBellComponent],
  template: `
    <div style="display: flex;">
      <app-sidebar [menuItems]="menuItems()"></app-sidebar>
      <div style="flex: 1; min-height: 100vh; overflow-y: auto; position: relative;">
        <div style="position: absolute; right: 30px; top: 30px; z-index: 1000;">
          <app-notification-bell></app-notification-bell>
        </div>
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  menuItems = computed(() => {
    const user = this.currentUser();
    const baseMenu = [
      { path: '/profile', label: 'Profile', icon: '👤' },
      { path: '/repayments', label: 'Repayments', icon: '💳' }
    ];

    if (!user) {
      return baseMenu;
    }

    switch (user.role) {
      case 'ADMIN':
        return [
          { path: '/admin/dashboard',     label: 'Dashboard',    icon: '📊' },
          { path: '/admin/banks',         label: 'Banks',        icon: '🏦' },
          { path: '/admin/transactions',  label: 'Transactions', icon: '💸' },
          { path: '/admin/users',         label: 'Users',        icon: '👥' },
          { path: '/admin/loan-types',    label: 'Loan Types',   icon: '💰' },
          { path: '/admin/reports',       label: 'Reports',      icon: '📈' },
          { path: '/profile',             label: 'Profile',      icon: '👤' },
        ];
      case 'CUSTOMER':
        return [
          { path: '/customer/dashboard',     label: 'Dashboard',        icon: '📊' },
          { path: '/customer/apply-loan',    label: 'Apply Loan',       icon: '📝' },
          { path: '/customer/applications',  label: 'My Applications',  icon: '📋' },
          { path: '/customer/your-accounts', label: 'Your Accounts',    icon: '🏦' },
          { path: '/customer/transactions',  label: 'My Transactions',  icon: '💳' },
          { path: '/profile',                label: 'Profile',           icon: '👤' },
          { path: '/notifications',          label: 'Notifications',    icon: '🔔' },
        ];
      case 'LOAN_OFFICER':
        return [
          { path: '/loan-officer/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/loan-officer/review', label: 'Review Applications', icon: '📋' },
          ...baseMenu
        ];
      case 'MANAGER':
        return [
          { path: '/manager/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/manager/approvals', label: 'Approvals', icon: '✅' },
          ...baseMenu
        ];
      default:
        return baseMenu;
    }
  });
}
