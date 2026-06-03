package com.pharmaconnect.controller;

import com.pharmaconnect.service.AuthService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Assignment 4:
 * - Bronze: login/register with JWT token (30-min inactivity session)
 * - Silver: password recovery endpoint + token refresh
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest req) {
        try {
            Map<String, Object> result = authService.login(req.email(), req.password());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            authService.register(req.email(), req.username(), req.password());
            return ResponseEntity.status(201).body(Map.of("message", "User registered successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Silver: Password recovery — step 1: request reset code by email.
     * In production this would send an email; here we return the code directly
     * (for demo/testing purposes in the lab).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        try {
            String resetCode = authService.generatePasswordResetCode(req.email());
            // In production: send email. For lab demo, return the code in response.
            return ResponseEntity.ok(Map.of(
                "message", "Reset code generated. Check your email.",
                "resetCode", resetCode  // remove in production, only for demo
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Silver: Password recovery — step 2: reset password with code.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        try {
            authService.resetPassword(req.email(), req.resetCode(), req.newPassword());
            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Silver: Token refresh endpoint — extends session explicitly.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Map<String, Object> result = authService.refreshToken(token);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token."));
        }
    }

    record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    record RegisterRequest(@Email @NotBlank String email,
                           @NotBlank String username,
                           @NotBlank String password) {}
    record ForgotPasswordRequest(@Email @NotBlank String email) {}
    record ResetPasswordRequest(@Email @NotBlank String email,
                                @NotBlank String resetCode,
                                @NotBlank String newPassword) {}
}
