package com.pharmaconnect.service;

import com.pharmaconnect.entity.AppUser;
import com.pharmaconnect.entity.Permission;
import com.pharmaconnect.entity.Role;
import com.pharmaconnect.repository.AppUserRepository;
import com.pharmaconnect.repository.PermissionRepository;
import com.pharmaconnect.repository.RoleRepository;
import com.pharmaconnect.security.JwtUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Assignment 4 Silver:
 * - login: JWT contains role + permissions for fine-grained authorization
 * - generatePasswordResetCode: 6-digit reset code
 * - resetPassword: validates code and updates password
 * - refreshToken: issues new JWT (sliding window session)
 */
@Service
public class AuthService {

    private final AppUserRepository userRepo;
    private final RoleRepository roleRepo;
    private final PermissionRepository permRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    // Silver: in-memory reset codes (email -> code). Production: use DB with expiry.
    private final ConcurrentHashMap<String, String> resetCodes = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public AuthService(AppUserRepository userRepo, RoleRepository roleRepo,
                       PermissionRepository permRepo, PasswordEncoder encoder,
                       JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.permRepo = permRepo;
        this.encoder  = encoder;
        this.jwtUtil  = jwtUtil;
    }

    @PostConstruct
    public void seedData() {
        var pRead     = permRepo.findByName("PRESCRIPTION_READ")
                .orElseGet(() -> permRepo.save(new com.pharmaconnect.entity.Permission("PRESCRIPTION_READ")));
        var pWrite    = permRepo.findByName("PRESCRIPTION_WRITE")
                .orElseGet(() -> permRepo.save(new com.pharmaconnect.entity.Permission("PRESCRIPTION_WRITE")));
        var pDelete   = permRepo.findByName("PRESCRIPTION_DELETE")
                .orElseGet(() -> permRepo.save(new com.pharmaconnect.entity.Permission("PRESCRIPTION_DELETE")));
        var pUserMgmt = permRepo.findByName("USER_MANAGE")
                .orElseGet(() -> permRepo.save(new com.pharmaconnect.entity.Permission("USER_MANAGE")));

        Role adminRole = roleRepo.findByName("ADMIN").orElseGet(() -> {
            Role r = new Role("ADMIN");
            r.setPermissions(Set.of(pRead, pWrite, pDelete, pUserMgmt));
            return roleRepo.save(r);
        });

        Role userRole = roleRepo.findByName("USER").orElseGet(() -> {
            Role r = new Role("USER");
            r.setPermissions(Set.of(pRead, pWrite));
            return roleRepo.save(r);
        });

        if (!userRepo.existsByEmail("admin@pharmaconnect.ro")) {
            AppUser admin = new AppUser();
            admin.setEmail("admin@pharmaconnect.ro");
            admin.setUsername("admin");
            admin.setPasswordHash(encoder.encode("admin123"));
            admin.setRoles(Set.of(adminRole));
            userRepo.save(admin);
        }

        if (!userRepo.existsByEmail("user@pharmaconnect.ro")) {
            AppUser user = new AppUser();
            user.setEmail("user@pharmaconnect.ro");
            user.setUsername("stefan");
            user.setPasswordHash(encoder.encode("user123"));
            user.setRoles(Set.of(userRole));
            userRepo.save(user);
        }
    }

    public Map<String, Object> login(String email, String password) {
        AppUser user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!encoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        Role primaryRole = user.getRoles().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("User has no role assigned."));
        String roleName = primaryRole.getName();

        // Silver: collect permissions from ALL roles
        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .collect(Collectors.toSet());

        String token = jwtUtil.generateToken(user.getUsername(), roleName, permissions);

        return Map.of(
            "token",       token,
            "username",    user.getUsername(),
            "role",        roleName,
            "userId",      user.getId(),
            "permissions", permissions
        );
    }

    public AppUser register(String email, String username, String password) {
        if (userRepo.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already in use.");
        }
        Role userRole = roleRepo.findByName("USER")
                .orElseThrow(() -> new RuntimeException("USER role not found"));

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(encoder.encode(password));
        user.setRoles(Set.of(userRole));
        return userRepo.save(user);
    }

    /** Silver: step 1 of password recovery — generate 6-digit code */
    public String generatePasswordResetCode(String email) {
        userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));
        String code = String.format("%06d", random.nextInt(1_000_000));
        resetCodes.put(email, code);
        return code;
    }

    /** Silver: step 2 of password recovery — validate code and update password */
    public void resetPassword(String email, String resetCode, String newPassword) {
        String stored = resetCodes.get(email);
        if (stored == null || !stored.equals(resetCode)) {
            throw new IllegalArgumentException("Invalid or expired reset code.");
        }
        AppUser user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setPasswordHash(encoder.encode(newPassword));
        userRepo.save(user);
        resetCodes.remove(email);
    }

    /** Bronze: refresh JWT for sliding-window session */
    public Map<String, Object> refreshToken(String token) {
        if (!jwtUtil.isValid(token)) {
            throw new IllegalArgumentException("Invalid or expired token.");
        }
        String newToken = jwtUtil.refreshToken(token);
        return Map.of("token", newToken);
    }
}
