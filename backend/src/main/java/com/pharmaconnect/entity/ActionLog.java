package com.pharmaconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Gold: persists every action performed by a logged-in user.
 * Format: USER_ID:GROUP_ID:ACTION_INFO:TIMESTAMP
 */
@Entity
@Table(name = "action_logs", indexes = {
    @Index(name = "idx_log_user", columnList = "user_id"),
    @Index(name = "idx_log_timestamp", columnList = "timestamp")
})
public class ActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "group_id", nullable = false, length = 20)
    private String groupId; // "ADMIN" or "USER"

    @Column(name = "action", nullable = false, length = 200)
    private String action; // e.g. "CREATE_PRESCRIPTION", "DELETE_PRESCRIPTION"

    @Column(name = "details", length = 500)
    private String details; // extra info, e.g. "Prescription id=5"

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    public ActionLog() {}

    public ActionLog(Long userId, String username, String groupId,
                     String action, String details, String ipAddress) {
        this.userId = userId;
        this.username = username;
        this.groupId = groupId;
        this.action = action;
        this.details = details;
        this.ipAddress = ipAddress;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getGroupId() { return groupId; }
    public String getAction() { return action; }
    public String getDetails() { return details; }
    public Instant getTimestamp() { return timestamp; }
    public String getIpAddress() { return ipAddress; }
}
