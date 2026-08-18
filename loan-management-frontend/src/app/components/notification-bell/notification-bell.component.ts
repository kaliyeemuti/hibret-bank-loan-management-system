import { Component, OnInit, OnDestroy, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService, NotificationResponse } from '../../core/services/notification.service';
import { WebSocketService, NotificationMessage } from '../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="notification-bell-container">
      <button class="bell-icon-btn" [class.active]="dropdownOpen()" (click)="toggleDropdown($event)" title="Notifications">
        <span>🔔</span>
        <span *ngIf="unreadCount() > 0" class="unread-badge">
          {{ unreadCount() > 99 ? '99+' : unreadCount() }}
        </span>
      </button>

      <div *ngIf="dropdownOpen()" class="notification-dropdown">
        <div class="dropdown-header">
          <h3>Notifications</h3>
          <button *ngIf="unreadCount() > 0" class="mark-all-btn" (click)="handleMarkAllAsRead($event)">
            Mark all as read
          </button>
        </div>

        <div class="dropdown-body">
          <div *ngFor="let item of recentNotifications()"
               class="notification-item"
               [class.unread]="!item.isRead"
               (click)="handleNotificationClick(item, $event)">
            <div class="notification-icon-wrapper">
              <span>{{ getIcon(item.notificationType) }}</span>
            </div>
            <div class="notification-content">
              <p class="notification-item-title">{{ item.title }}</p>
              <p class="notification-item-msg">{{ item.message }}</p>
              <span class="notification-item-time">{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>

          <div *ngIf="recentNotifications().length === 0" class="dropdown-empty">
            <span class="dropdown-empty-icon">📭</span>
            <p>You have no notifications</p>
          </div>
        </div>

        <div class="dropdown-footer">
          <a routerLink="/notifications" class="view-all-link" (click)="closeDropdown()">
            View All Notifications
          </a>
        </div>
      </div>
    </div>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notificationService = inject(NotificationService);
  webSocketService = inject(WebSocketService);
  elementRef = inject(ElementRef);

  dropdownOpen = signal<boolean>(false);
  unreadCount = signal<number>(0);
  recentNotifications = signal<NotificationResponse[]>([]);

  private notificationSubscription: Subscription | null = null;

  ngOnInit() {
    this.fetchData();
    this.connectWebSocket();
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }

  connectWebSocket() {
    this.webSocketService.connect();

    this.notificationSubscription = this.webSocketService.getNotifications().subscribe({
      next: (notification: NotificationMessage) => {
        console.log('[NotificationBell] Received WebSocket notification:', notification);
        this.handleNewNotification(notification);
      },
      error: (err) => console.error('[NotificationBell] WebSocket error:', err)
    });
  }

  handleNewNotification(notification: NotificationMessage) {
    // Increment unread count
    this.unreadCount.update(count => count + 1);

    // Add to recent notifications (at the beginning)
    const notificationResponse: NotificationResponse = {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      notificationType: notification.notificationType,
      deliveryType: 'WEBSOCKET',
      status: 'DELIVERED',
      isRead: notification.isRead,
      createdAt: notification.createdAt
    };

    this.recentNotifications.update(notifications => {
      const updated = [notificationResponse, ...notifications];
      return updated.slice(0, 5); // Keep only top 5
    });
  }

  fetchData() {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.unreadCount),
      error: (err) => console.error('Error fetching unread count:', err)
    });

    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        // Take top 5
        this.recentNotifications.set(res.slice(0, 5));
      },
      error: (err) => console.error('Error fetching notifications:', err)
    });
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.update(val => !val);
    if (this.dropdownOpen()) {
      this.fetchData();
    }
  }

  closeDropdown() {
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  handleNotificationClick(notification: NotificationResponse, event: Event) {
    event.stopPropagation();
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.fetchData();
        },
        error: (err) => console.error('Error marking notification as read:', err)
      });
    }
  }

  handleMarkAllAsRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.fetchData();
      },
      error: (err) => console.error('Error marking all notifications as read:', err)
    });
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
      // Nice format: e.g. "Jul 20, 12:45 PM"
      return date.toLocaleDateString(undefined, {
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
