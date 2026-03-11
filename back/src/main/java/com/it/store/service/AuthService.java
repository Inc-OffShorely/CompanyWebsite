package com.it.store.service;

import com.it.store.Entity.Employee;
import com.it.store.Repository.EmployeeRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(EmployeeRepository employeeRepository,
                       PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Optional<Employee> login(String login, String rawPassword) {
        Optional<Employee> opt = employeeRepository.findByLogin(login);
        if (opt.isEmpty()) {
            return Optional.empty();
        }

        Employee e = opt.get();

        if (!passwordEncoder.matches(rawPassword, e.getPasswordHash())) {
            return Optional.empty();
        }

        e.setHasActiveSession(true);
        e.setLastActivityAt(OffsetDateTime.now());
        employeeRepository.save(e);

        return Optional.of(e);
    }

    @Transactional
    public void logout(Long userId) {
        employeeRepository.findById(userId).ifPresent(e -> {
            e.setHasActiveSession(false);
            e.setLastActivityAt(OffsetDateTime.now());
            employeeRepository.save(e);
        });
    }

    @Transactional
    public void touch(Long employeeId) {
        Employee e = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        e.setLastActivityAt(OffsetDateTime.now());
        e.setHasActiveSession(true);
        employeeRepository.save(e);
    }
}