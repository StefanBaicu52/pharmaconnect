package com.pharmaconnect.controller;

import com.pharmaconnect.entity.ActionLog;
import com.pharmaconnect.entity.AppUser;
import com.pharmaconnect.service.LoggingService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Assignment 4 Silver: All admin endpoints require ADMIN role.
 * SecurityConfig already blocks /admin/** for non-admins,
 * @PreAuthorize adds method-level double check.
 */
@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final LoggingService loggingService;

    public AdminController(LoggingService loggingService) {
        this.loggingService = loggingService;
    }

    @GetMapping("/logs")
    public Map<String, Object> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ActionLog> result = loggingService.getLogs(page, size);
        return Map.of(
            "data", result.getContent(),
            "total", result.getTotalElements(),
            "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/suspicious")
    public List<AppUser> getSuspiciousUsers() {
        return loggingService.getSuspiciousUsers();
    }

    @DeleteMapping("/suspicious/{userId}")
    public ResponseEntity<Map<String, String>> clearSuspicious(@PathVariable Long userId) {
        loggingService.clearSuspicious(userId);
        return ResponseEntity.ok(Map.of("message", "User cleared from observation list."));
    }

    @GetMapping("/logs/user/{userId}")
    public List<ActionLog> getLogsByUser(@PathVariable Long userId) {
        return loggingService.getLogsByUser(userId);
    }
}
