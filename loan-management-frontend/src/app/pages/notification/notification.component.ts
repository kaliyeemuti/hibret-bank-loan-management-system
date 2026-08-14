import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationResponse } from '../../core/services/notification.service';
import { BackButtonComponent } from '../../components/back-button/back-button.component';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  template: `
    <div class="notification-page-wrapper">
      <app-back-button></app-back-button>
      <div class="notification-page-header">
        <div>
          <h1>Notifications</h1>
          <p>View and manage your account notifications and loan updates</p>
        </div>
        <button *ngIf="notifications().length > 0" class="btn btn-secondary" (click)="handleMarkAllAsRead()">
          Mark All as Read
        </button>
      </div>

      <div class="page-content">
        <div *ngIf="successMsg" class="success-message" style="margin-bottom: 20px;">
          {{ successMsg }}
        </div>
        <div *ngIf="errorMsg" class="error-message" style="margin-bottom: 20px;">
          {{ errorMsg }}
        </div>

        <div class="notification-history-card">
          <div *ngFor="let item of notifications()"
               class="notification-history-item"
               [class.unread]="!item.isRead">
            <div class="notification-icon-wrapper" style="width: 40px; height: 40px; font-size: 20px;">
              <span>{{ getIcon(item.notificationType) }}</span>
            </div>
            
            <div class="notification-content">
              <h3 class="notification-item-title" style="font-size: 15px;">{{ item.title }}</h3>
              <p class="notification-item-msg" style="font-size: 13.5px;">{{ item.message }}</p>
              <span class="notification-item-time">{{ formatTime(item.createdAt) }}</span>
            </div>

            <div class="notification-history-actions">
              <button *ngIf="!item.isRead"
                      class="btn-icon"
                      (click)="handleMarkAsRead(item.id)"
                      title="Mark as Read">
                ✔
              </button>
              <button class="btn-icon delete"
                      (click)="handleDelete(item.id)"
                      title="Delete Notification">
                🗑
              </button>
            </div>
          </div>

          <div *ngIf="notifications().length === 0" class="empty-state" style="padding: 60px 20px;">
            <span style="font-size: 48px; display: block; margin-bottom: 15px;">📭</span>
            <h3>No Notifications</h3>
            <p>You have no notifications in your history.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationComponent implements OnInit {
  notificationService = inject(NotificationService);

  notifications = signal<NotificationResponse[]>([]);
  successMsg = '';
  errorMsg = '';

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.getNotificationHistory().subscribe({
      next: (data) => {
        this.notifications.set(data || []);
      },
      error: (err) => {
        console.error('Error loading notification history:', err);
        this.errorMsg = 'Failed to load notifications.';
      }
    });
  }

  handleMarkAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.successMsg = 'Notification marked as read.';
        this.errorMsg = '';
        this.loadNotifications();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        console.error('Error marking read:', err);
        this.errorMsg = 'Failed to mark notification as read.';
      }
    });
  }

  handleMarkAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.successMsg = 'All notifications marked as read.';
        this.errorMsg = '';
        this.loadNotifications();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        console.error('Error marking all read:', err);
        this.errorMsg = 'Failed to mark notifications as read.';
      }
    });
  }

  handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(id).subscribe({
        next: () => {
          this.successMsg = 'Notification deleted successfully.';
          this.errorMsg = '';
          this.loadNotifications();
          setTimeout(() => this.successMsg = '', 3000);
        },
        error: (err) => {
          console.error('Error deleting notification:', err);
          this.errorMsg = 'Failed to delete notification.';
        }
      });
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'REGISTRATION': return '🎉';
      case 'LOAN_SUBMITTED': return '📥';
      case 'LOAN_UNDER_REVIEW': return '🔍';
      case 'MORE_INFORMATION_REQUESTED': return 'ℹ️';
      case 'LOAN_APPROVED': return '✅';
      case 'LOAN_REJECTED': return '❌';
      case 'PASSWORD_RESET': return '🔑';
      default: return '📢';
    }
  }

  formatTime(createdAt: string): string {
    if (!createdAt) return '';
    try {
      const date = new Date(createdAt);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return createdAt;
    }
  }
}
