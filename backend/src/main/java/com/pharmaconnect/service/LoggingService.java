package com.pharmaconnect.service;

import com.pharmaconnect.entity.ActionLog;
import com.pharmaconnect.entity.AppUser;
import com.pharmaconnect.repository.ActionLogRepository;
import com.pharmaconnect.repository.AppUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoggingService {

    private final ActionLogRepository logRepo;
    private final AppUserRepository userRepo;

    // Thresholds for suspicious behaviour detection
    private static final int MAX_DELETES_PER_HOUR   = 10; // >=10 deletes triggers alert
    private static final int MAX_ACTIONS_PER_MINUTE = 30;

    public LoggingService(ActionLogRepository logRepo, AppUserRepository userRepo) {
        this.logRepo = logRepo;
        this.userRepo = userRepo;
    }

    public void log(Long userId, String username, String role,
                    String action, String details, String ip) {
        ActionLog entry = new ActionLog(userId, username, role, action, details, ip);
        logRepo.save(entry);
        // Only check for suspicious behaviour for known users (userId > 0)
        if (userId != null && userId > 0) {
            checkMaliciousBehaviour(userId, username, role);
        }
    }

    public void checkMaliciousBehaviour(Long userId, String username, String role) {
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        Instant oneMinAgo  = Instant.now().minus(1, ChronoUnit.MINUTES);

        // Count delete actions in the last hour for this user
        long deleteCount = logRepo.findDeleteActionsSince(oneHourAgo)
                .stream().filter(l -> l.getUserId().equals(userId)).count();

        // Count all actions in last minute for this user
        long actionCount = logRepo.findByTimestampAfter(oneMinAgo)
                .stream().filter(l -> l.getUserId().equals(userId)).count();

        final String suspiciousReason;
        if (deleteCount >= MAX_DELETES_PER_HOUR) {
            suspiciousReason = "Too many DELETE actions in 1 hour: " + deleteCount;
        } else if (actionCount > MAX_ACTIONS_PER_MINUTE) {
            suspiciousReason = "Too many actions per minute: " + actionCount;
        } else {
            suspiciousReason = null;
        }

        if (suspiciousReason != null) {
            userRepo.findById(userId).ifPresent(user -> {
                if (!user.isSuspicious()) {
                    user.setSuspicious(true);
                    user.setSuspiciousReason(suspiciousReason);
                    userRepo.save(user);
                }
            });
        }
    }

    public Page<ActionLog> getLogs(int page, int size) {
        return logRepo.findAllByOrderByTimestampDesc(PageRequest.of(page, size));
    }

    public List<ActionLog> getLogsByUser(Long userId) {
        return logRepo.findByUserId(userId);
    }

    public List<AppUser> getSuspiciousUsers() {
        return userRepo.findBySuspiciousTrue();
    }

    public void clearSuspicious(Long userId) {
        userRepo.findById(userId).ifPresent(user -> {
            user.setSuspicious(false);
            user.setSuspiciousReason(null);
            userRepo.save(user);
        });
    }
}
