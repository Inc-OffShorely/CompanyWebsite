package com.it.store.Controller;

import com.it.store.Entity.Employee;
import com.it.store.api.dto.AuthResponse;
import com.it.store.api.dto.LoginRequest;
import com.it.store.security.JwtTokenProvider;
import com.it.store.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final JwtTokenProvider jwt;

    public AuthController(AuthService auth, JwtTokenProvider jwt) {
        this.auth = auth;
        this.jwt = jwt;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Optional<Employee> empOpt = auth.login(req.login(), req.password());
        if (empOpt.isEmpty()) {
            return ResponseEntity.status(401)
                    .body(new ErrorBody("INVALID_CREDENTIALS", "Неверный логин или пароль"));
        }

        Employee e = empOpt.get();

        List<String> roles = e.getRoles().stream()
                .map(r -> r.getCode())
                .toList();

        String primaryRole = "employee";
        if (roles.contains("admin")) primaryRole = "admin";
        else if (roles.contains("moderator")) primaryRole = "moderator";

        String token = jwt.generateToken(
                e.getId(),
                e.getLogin(),
                e.getFullName(),
                roles
        );

        AuthResponse resp = new AuthResponse(
                e.getId(),
                e.getLogin(),
                e.getFullName(),
                e.getEmail(),
                e.getPositionTitle(),
                primaryRole,
                token,
                roles
        );

        resp.setCanManageDocuments(Boolean.TRUE.equals(e.getCanManageDocuments()));
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/ping")
    public ResponseEntity<Void> ping(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long employeeId = extractEmployeeIdFromHeader(authHeader);
        if (employeeId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        auth.touch(employeeId); // ОБЯЗАТЕЛЬНО: last_activity_at=now и has_active_session=true
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long employeeId = extractEmployeeIdFromHeader(authHeader);
        if (employeeId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        auth.logout(employeeId); // ОБЯЗАТЕЛЬНО: has_active_session=false
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    private Long extractEmployeeIdFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring("Bearer ".length()).trim();
        try {
            return jwt.getEmployeeId(token);
        } catch (Exception e) {
            return null;
        }
    }

    static class ErrorBody {
        public final String error;
        public final String message;
        ErrorBody(String error, String message) {
            this.error = error;
            this.message = message;
        }
    }
}