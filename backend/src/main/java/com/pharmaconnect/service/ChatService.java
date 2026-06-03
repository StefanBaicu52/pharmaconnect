package com.pharmaconnect.service;

import com.pharmaconnect.entity.ChatMessage;
import com.pharmaconnect.repository.ChatMessageRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {

    private final ChatMessageRepository chatRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatMessageRepository chatRepo,
                       SimpMessagingTemplate messagingTemplate) {
        this.chatRepo = chatRepo;
        this.messagingTemplate = messagingTemplate;
    }

    /** Save message to MongoDB and broadcast via WebSocket */
    public ChatMessage sendMessage(String senderId, String senderUsername,
                                   String content, String roomId) {
        ChatMessage msg = new ChatMessage(senderId, senderUsername, content, roomId);
        ChatMessage saved = chatRepo.save(msg);  // persisted in MongoDB

        // Broadcast to all subscribers of /topic/chat/{roomId}
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, saved);

        return saved;
    }

    /** Load last 50 messages for a room (history) */
    public List<ChatMessage> getHistory(String roomId) {
        List<ChatMessage> msgs = chatRepo.findTop50ByRoomIdOrderByTimestampDesc(roomId);
        // Reverse so oldest is first
        java.util.Collections.reverse(msgs);
        return msgs;
    }
}
