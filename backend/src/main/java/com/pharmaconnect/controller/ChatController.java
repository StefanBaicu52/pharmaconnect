package com.pharmaconnect.controller;

import com.pharmaconnect.entity.ChatMessage;
import com.pharmaconnect.service.ChatService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @MessageMapping("/chat/{roomId}")
    public void handleMessage(@DestinationVariable String roomId,
                              @Payload Map<String, String> payload,
                              Authentication auth) {

        String content  = payload.getOrDefault("content", "");

        // Use username from JWT if available, otherwise from payload
        String username;
        String senderId;
        if (auth != null && auth.isAuthenticated()) {
            username = auth.getName();
            senderId = auth.getName();
        } else {
            username = payload.getOrDefault("senderUsername", "anonymous");
            senderId = payload.getOrDefault("senderId", "anonymous");
        }

        chatService.sendMessage(senderId, username, content, roomId);
    }

    @GetMapping("/chat/{roomId}/history")
    public List<ChatMessage> getHistory(@PathVariable String roomId) {
        return chatService.getHistory(roomId);
    }
}