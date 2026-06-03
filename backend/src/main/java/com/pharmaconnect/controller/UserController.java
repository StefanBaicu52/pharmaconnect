package com.pharmaconnect.controller;

import com.pharmaconnect.entity.Permission;
import com.pharmaconnect.entity.Role;
import com.pharmaconnect.repository.AppUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Assignment 4 Silver: /me endpoint shows current user's role and permissions.
 * Useful for demonstrating that different token schemes work for different roles.
 */
@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final AppUserRepository userRepo;

    public UserController(AppUserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUser(Authentication auth) {
        return userRepo.findByUsername(auth.getName())
                .map(user -> {
                    String role = user.getRoles().stream()
                            .findFirst().map(Role::getName).orElse("USER");
                    Set<String> permissions = user.getRoles().stream()
                            .flatMap(r -> r.getPermissions().stream())
                            .map(Permission::getName)
                            .collect(Collectors.toSet());
                    return ResponseEntity.ok(Map.of(
                        "id",          user.getId(),
                        "username",    user.getUsername(),
                        "email",       user.getEmail(),
                        "role",        role,
                        "permissions", permissions,
                        "suspicious",  user.isSuspicious()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Silver: Admin can list all users */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        var users = userRepo.findAll().stream().map(user -> {
            String role = user.getRoles().stream()
                    .findFirst().map(Role::getName).orElse("USER");
            return Map.of(
                "id",         user.getId(),
                "username",   user.getUsername(),
                "email",      user.getEmail(),
                "role",       role,
                "suspicious", user.isSuspicious()
            );
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}
