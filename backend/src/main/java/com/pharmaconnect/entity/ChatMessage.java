package com.pharmaconnect.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

/**
 * Silver: Chat messages stored in MongoDB (NoSQL).
 * Each message is a document in the "chat_messages" collection.
 */
@Document(collection = "chat_messages")
public class ChatMessage {

    @Id
    private String id;

    private String senderId;
    private String senderUsername;
    private String content;
    private Instant timestamp = Instant.now();
    private String roomId = "general"; // support for multiple chat rooms

    public ChatMessage() {}

    public ChatMessage(String senderId, String senderUsername, String content, String roomId) {
        this.senderId = senderId;
        this.senderUsername = senderUsername;
        this.content = content;
        this.roomId = roomId;
        this.timestamp = Instant.now();
    }

    public String getId() { return id; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getSenderUsername() { return senderUsername; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getTimestamp() { return timestamp; }
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
}
