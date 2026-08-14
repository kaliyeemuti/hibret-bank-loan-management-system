package com.loansystem.loan.infrastructure.controller;

import com.loansystem.loan.application.service.NotificationService;
import com.loansystem.loan.domain.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<Notification> getNotifications() {
        return notificationService.getNotificationsForCurrentUser();
    }

    @GetMapping("/history")
    public List<Notification> getNotificationHistory() {
        return notificationService.getNotificationHistoryForCurrentUser();
    }

    @GetMapping("/unread-count")
    public Map<String, Object> getUnreadCount() {
        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", notificationService.getUnreadCountForCurrentUser());
        return response;
    }

    @PutMapping("/{id}/read")
    public Notification markAsRead(@PathVariable Long id) {
        return notificationService.markAsRead(id);
    }

    @PutMapping("/read-all")
    public void markAllAsRead() {
        notificationService.markAllAsRead();
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
    }
}
