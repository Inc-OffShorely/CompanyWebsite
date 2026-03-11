package com.it.store.service;

import com.it.store.Repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;

@Service
public class SessionJanitor {

    private final EmployeeRepository employees;
    private final Duration idleCutoff;

    public SessionJanitor(
            EmployeeRepository employees,
            @Value("${app.idle.inactivityMinutes:5}") long inactivityMinutes,
            @Value("${app.idle.confirmationGraceSeconds:60}") long graceSeconds
    ) {
        this.employees = employees;
        this.idleCutoff = Duration.ofMinutes(inactivityMinutes).plusSeconds(graceSeconds);
    }

    @Scheduled(fixedDelayString = "${app.idle.sweeperMs:30000}")
    public void sweep() {
        OffsetDateTime threshold = OffsetDateTime.now().minus(idleCutoff);
        employees.deactivateIdleSessions(threshold);
    }
}