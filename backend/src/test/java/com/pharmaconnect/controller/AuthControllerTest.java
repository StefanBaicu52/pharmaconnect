package com.pharmaconnect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Assignment 4 Bronze + Silver: Tests for authentication, authorization, and session.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    // ── Helper: get JWT token ─────────────────────────────────────────────────

    private String getToken(String email, String password) throws Exception {
        MvcResult result = mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        Map<?, ?> body = mapper.readValue(result.getResponse().getContentAsString(), Map.class);
        return (String) body.get("token");
    }

    // ── Bronze: Login tests ───────────────────────────────────────────────────

    @Test
    void loginWithValidAdminCredentials_returnsTokenAndRole() throws Exception {
        mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "admin@pharmaconnect.ro",
                    "password", "admin123"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.permissions").isArray());
    }

    @Test
    void loginWithNormalUser_returnsUserRoleAndRestrictedPermissions() throws Exception {
        mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "user@pharmaconnect.ro",
                    "password", "user123"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.permissions").isArray());
    }

    @Test
    void loginWithWrongPassword_returns401() throws Exception {
        mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "admin@pharmaconnect.ro",
                    "password", "wrongpassword"
                ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void loginWithUnknownEmail_returns401() throws Exception {
        mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "nobody@test.com",
                    "password", "whatever"
                ))))
                .andExpect(status().isUnauthorized());
    }

    // ── Bronze: Register tests ────────────────────────────────────────────────

    @Test
    void registerNewUser_returns201() throws Exception {
        mvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "newuser_" + System.currentTimeMillis() + "@test.com",
                    "username", "newuser",
                    "password", "pass123"
                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void registerWithDuplicateEmail_returns400() throws Exception {
        mvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "admin@pharmaconnect.ro",
                    "username", "duplicate",
                    "password", "pass123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    // ── Bronze: Protected routes require auth ─────────────────────────────────

    @Test
    void accessProtectedRouteWithoutToken_returns401or403() throws Exception {
        mvc.perform(get("/prescriptions"))
                .andExpect(result ->
                    org.junit.jupiter.api.Assertions.assertTrue(
                        result.getResponse().getStatus() == 401 ||
                        result.getResponse().getStatus() == 403
                    )
                );
    }

    @Test
    void accessProtectedRouteWithValidToken_returns200() throws Exception {
        String token = getToken("user@pharmaconnect.ro", "user123");
        mvc.perform(get("/prescriptions")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void responseContainsRefreshedTokenHeader() throws Exception {
        String token = getToken("user@pharmaconnect.ro", "user123");
        mvc.perform(get("/prescriptions")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Refreshed-Token"));
    }

    // ── Silver: Authorization — role-based access ─────────────────────────────

    @Test
    void userCannotDeletePrescription_returns403() throws Exception {
        // First create a prescription as admin
        String adminToken = getToken("admin@pharmaconnect.ro", "admin123");
        MvcResult createResult = mvc.perform(post("/prescriptions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "medicationName", "TestMed",
                    "date", "01/01/2026",
                    "doctor", "Dr. Test",
                    "status", "PENDING"
                ))))
                .andExpect(status().isCreated())
                .andReturn();
        Map<?, ?> created = mapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        int id = (int) created.get("id");

        // Now try to delete as USER — should be forbidden
        String userToken = getToken("user@pharmaconnect.ro", "user123");
        mvc.perform(delete("/prescriptions/" + id)
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        // Cleanup: admin can delete
        mvc.perform(delete("/prescriptions/" + id)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void adminCanDeletePrescription_returns204() throws Exception {
        String adminToken = getToken("admin@pharmaconnect.ro", "admin123");
        MvcResult createResult = mvc.perform(post("/prescriptions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "medicationName", "ToDelete",
                    "date", "01/01/2026",
                    "doctor", "Dr. Test",
                    "status", "PENDING"
                ))))
                .andExpect(status().isCreated())
                .andReturn();
        Map<?, ?> created = mapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        int id = (int) created.get("id");

        mvc.perform(delete("/prescriptions/" + id)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void userCannotAccessAdminPanel_returns403() throws Exception {
        String userToken = getToken("user@pharmaconnect.ro", "user123");
        mvc.perform(get("/admin/logs")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanAccessAdminPanel_returns200() throws Exception {
        String adminToken = getToken("admin@pharmaconnect.ro", "admin123");
        mvc.perform(get("/admin/logs")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.total").isNumber());
    }

    @Test
    void userCanCreatePrescription_returns201() throws Exception {
        String userToken = getToken("user@pharmaconnect.ro", "user123");
        mvc.perform(post("/prescriptions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "medicationName", "UserMed",
                    "date", "01/01/2026",
                    "doctor", "Dr. User",
                    "status", "PENDING"
                ))))
                .andExpect(status().isCreated());
    }

    // ── Silver: Password recovery ─────────────────────────────────────────────

    @Test
    void forgotPassword_returnsResetCode() throws Exception {
        mvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "user@pharmaconnect.ro"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetCode").exists())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void forgotPasswordForUnknownEmail_returns404() throws Exception {
        mvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "nobody@nowhere.com"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void resetPassword_withValidCode_resetsAndCanLogin() throws Exception {
        // Step 1: get reset code
        MvcResult forgotResult = mvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", "user@pharmaconnect.ro"))))
                .andExpect(status().isOk())
                .andReturn();
        Map<?, ?> forgotBody = mapper.readValue(forgotResult.getResponse().getContentAsString(), Map.class);
        String resetCode = (String) forgotBody.get("resetCode");

        // Step 2: reset to same password (so we don't break other tests)
        mvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "user@pharmaconnect.ro",
                    "resetCode", resetCode,
                    "newPassword", "user123"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        // Step 3: login with new password works
        mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "user@pharmaconnect.ro",
                    "password", "user123"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void resetPassword_withInvalidCode_returns400() throws Exception {
        mvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", "user@pharmaconnect.ro",
                    "resetCode", "000000",
                    "newPassword", "newpass123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    // ── Silver: Token refresh ─────────────────────────────────────────────────

    @Test
    void refreshToken_withValidToken_returnsNewToken() throws Exception {
        String token = getToken("user@pharmaconnect.ro", "user123");
        mvc.perform(post("/auth/refresh")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }
}
