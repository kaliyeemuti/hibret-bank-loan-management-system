package com.loansystem.loan.application.service.impl;

import com.loansystem.loan.application.service.NotificationService;
import com.loansystem.loan.domain.entity.Notification;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.repository.NotificationRepository;
import com.loansystem.loan.domain.repository.UserRepository;
import com.loansystem.loan.infrastructure.websocket.NotificationWebSocketController;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationWebSocketController notificationWebSocketController;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @Override
    public List<Notification> getNotificationsForCurrentUser() {
        User user = getAuthenticatedUser();
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Override
    public List<Notification> getNotificationHistoryForCurrentUser() {
        User user = getAuthenticatedUser();
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Override
    public long getUnreadCountForCurrentUser() {
        User user = getAuthenticatedUser();
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Override
    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead() {
        User user = getAuthenticatedUser();
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        for (Notification notification : notifications) {
            if (!notification.getIsRead()) {
                notification.setIsRead(true);
            }
        }
        notificationRepository.saveAll(notifications);
    }

    @Override
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    @Override
    public Notification sendNotification(User user, String title, String message, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .notificationType(type)
                .isRead(false)
                .build();
        Notification savedNotification = notificationRepository.save(notification);
        
        // Push notification via WebSocket for real-time delivery
        notificationWebSocketController.sendNotificationToUser(user.getId(), savedNotification);
        
        return savedNotification;
    }
}
