package com.pharmaconnect.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Assignment 4 Bronze: validates JWT and refreshes it on each request
 * to implement sliding-window inactivity session.
 * The refreshed token is returned in the X-Refreshed-Token header.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.isValid(token)) {
                String username = jwtUtil.extractUsername(token);
                String role     = jwtUtil.extractRole(token);

                var auth = new UsernamePasswordAuthenticationToken(
                        username, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);

                // Store user info in request attributes for logging
                request.setAttribute("userId", username);
                request.setAttribute("userRole", role);

                // Sliding window: refresh token on every authenticated request
                // Client should update its stored token with this value
                String refreshed = jwtUtil.refreshToken(token);
                response.setHeader("X-Refreshed-Token", refreshed);
                response.setHeader("Access-Control-Expose-Headers", "X-Refreshed-Token");
            }
        }

        chain.doFilter(request, response);
    }
}
