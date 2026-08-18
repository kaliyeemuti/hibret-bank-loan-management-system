package com.loansystem.loan.infrastructure.websocket;

import com.loansystem.loan.domain.repository.UserRepository;
import com.loansystem.loan.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract JWT token from CONNECT frame headers
            String token = accessor.getFirstNativeHeader("Authorization");
            
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                
                try {
                    if (tokenProvider.validateToken(token)) {
                        String username = tokenProvider.getUsernameFromJWT(token);
                        
                        userRepository.findByEmail(username).ifPresent(user -> {
                            org.springframework.security.core.userdetails.UserDetails userDetails =
                                    org.springframework.security.core.userdetails.User.builder()
                                            .username(user.getEmail())
                                            .password(user.getPassword())
                                            .disabled(!user.getEnabled())
                                            .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                                            .build();

                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());

                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            accessor.setUser(authentication);
                            
                            log.info("WebSocket authenticated user: {}", username);
                        });
                    }
                } catch (Exception e) {
                    log.error("Failed to authenticate WebSocket connection", e);
                }
            }
        }

        return message;
    }
}
