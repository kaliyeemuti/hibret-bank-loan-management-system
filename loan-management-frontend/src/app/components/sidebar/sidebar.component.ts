import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="logo">
                <div class="logo-placeholder">🏦</div>
                <span>Hibret</span>
            </div>
        </div>

        <div class="sidebar-user">
            <div class="user-avatar">
                {{ userInitial() }}
            </div>
            <div class="user-info">
                <p class="user-name">{{ currentUser()?.fullName || 'Loading...' }}</p>
                <p class="user-role">{{ currentUser()?.role?.replace('_', ' ') || 'Guest' }}</p>
            </div>
        </div>

        <nav class="sidebar-menu">
            <a *ngFor="let item of menuItems"
               [routerLink]="item.path"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: item.path.endsWith('/dashboard') }"
               class="sidebar-menu-item"
               [title]="item.label">
                <span class="menu-icon">{{ item.icon }}</span>
                <span class="menu-label">{{ item.label }}</span>
            </a>
        </nav>

        <div class="sidebar-footer">
            <button (click)="handleLogout()" class="logout-btn">
                <span>🚪</span>
                <span>Logout</span>
            </button>
        </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() menuItems: Array<{ path: string; label: string; icon: string }> = [];

  authService = inject(AuthService);
  router = inject(Router);

  currentUser = this.authService.currentUser;

  userInitial() {
    const name = this.currentUser()?.fullName;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  handleLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
