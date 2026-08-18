package com.loansystem.loan.infrastructure.websocket;

import com.loansystem.loan.domain.entity.Notification;
import com.loansystem.loan.domain.entity.User;
import com.loansystem.loan.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class NotificationWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    /**
     * Send a notification to a specific user via WebSocket
     * This method is called by NotificationService when a new notification is created
     */
    public void sendNotificationToUser(Long userId, Notification notification) {
        // Send to user-specific destination: /user/{userId}/queue/notifications
        String destination = "/user/" + userId + "/queue/notifications";
        log.info("Sending notification to user {} via WebSocket: {}", userId, notification.getTitle());
        messagingTemplate.convertAndSend(destination, notification);
    }

    /**
     * Optional: Client can send a message to subscribe/connect
     * This is mainly for connection testing
     */
    @MessageMapping("/ws/hello")
    @SendTo("/topic/greetings")
    public String greeting(String message) {
        return "Hello, " + message + "!";
    }
}
