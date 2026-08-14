package com.loansystem.loan.application.service;

import com.loansystem.loan.domain.entity.Notification;
import com.loansystem.loan.domain.entity.User;

import java.util.List;

public interface NotificationService {

    List<Notification> getNotificationsForCurrentUser();

    List<Notification> getNotificationHistoryForCurrentUser();

    long getUnreadCountForCurrentUser();

    Notification markAsRead(Long id);

    void markAllAsRead();

    void deleteNotification(Long id);

    Notification sendNotification(User user, String title, String message, String type);
}
