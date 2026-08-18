import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';

export interface NotificationMessage {
  id: number;
  userId: number;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private notificationSubject = new Subject<NotificationMessage>();
  private connectionSubject = new Subject<boolean>();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.stompClient && this.stompClient.connected) {
      return;
    }

    // Get token from sessionStorage since AuthService doesn't expose getToken()
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    const currentUser = this.authService.currentUser();

    if (!token || !currentUser) {
      console.error('Cannot connect to WebSocket: No token or user');
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('[WebSocket] Connected to server');
      this.connectionSubject.next(true);

      // Subscribe to user-specific notifications
      const destination = `/user/${currentUser.id}/queue/notifications`;
      if (this.stompClient) {
        this.stompClient.subscribe(destination, (message: IMessage) => {
          const notification: NotificationMessage = JSON.parse(message.body);
          console.log('[WebSocket] Received notification:', notification);
          this.notificationSubject.next(notification);
        });
      }
    };

    this.stompClient.onStompError = (frame) => {
      console.error('[STOMP] Error:', frame);
      this.connectionSubject.next(false);
    };

    this.stompClient.onDisconnect = () => {
      console.log('[WebSocket] Disconnected from server');
      this.connectionSubject.next(false);
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }

    this.connectionSubject.next(false);
  }

  getNotifications(): Observable<NotificationMessage> {
    return this.notificationSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }
}
