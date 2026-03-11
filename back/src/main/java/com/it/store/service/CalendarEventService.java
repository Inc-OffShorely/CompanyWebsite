package com.it.store.service;

import com.it.store.Entity.CalendarEvent;
import com.it.store.Entity.Employee;
import com.it.store.Repository.CalendarEventRepository;
import com.it.store.Repository.EmployeeRepository;
import com.it.store.api.dto.CalendarEventDto;
import com.it.store.api.dto.CreateCalendarEventRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final EmployeeRepository employeeRepository;

    private static final DateTimeFormatter DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    public List<CalendarEventDto> getByDate(String date) {
        LocalDate d = LocalDate.parse(date, DATE);
        return calendarEventRepository.findByEventDateOrderByCreatedAtAsc(d)
                .stream().map(this::toDto).toList();
    }

    public List<CalendarEventDto> getRange(String from, String to) {
        LocalDate f = LocalDate.parse(from, DATE);
        LocalDate t = LocalDate.parse(to, DATE);
        return calendarEventRepository.findRange(f, t)
                .stream().map(this::toDto).toList();
    }

    public CalendarEventDto create(CreateCalendarEventRequest req) {
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("title is required");
        }
        if (req.getDate() == null || req.getDate().trim().isEmpty()) {
            throw new IllegalArgumentException("date is required");
        }

        Employee current = getCurrentEmployee();

        CalendarEvent event = CalendarEvent.builder()
                .eventDate(LocalDate.parse(req.getDate(), DATE))
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .createdAt(LocalDateTime.now())
                .createdBy(current)
                .build();

        CalendarEvent saved = calendarEventRepository.save(event);
        return toDto(saved);
    }

    private Employee getCurrentEmployee() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new IllegalStateException("Unauthenticated");
        }

        Object principal = auth.getPrincipal();
        if (principal == null) {
            throw new IllegalStateException("Unauthenticated: principal is null");
        }

        Long uid;
        if (principal instanceof Long) {
            uid = (Long) principal;
        } else if (principal instanceof Integer) {
            uid = ((Integer) principal).longValue();
        } else if (principal instanceof String) {
            uid = Long.valueOf((String) principal);
        } else {
            throw new IllegalStateException("Unsupported principal type: " + principal.getClass());
        }

        return employeeRepository.findById(uid)
                .orElseThrow(() -> new IllegalStateException("Employee not found for id: " + uid));
    }

    private CalendarEventDto toDto(CalendarEvent e) {
        Employee emp = e.getCreatedBy();

        String createdByName = null;
        Long createdById = null;

        if (emp != null) {
            createdById = emp.getId();
            createdByName = emp.getFullName();
            if (createdByName != null) createdByName = createdByName.trim();
        }

        return CalendarEventDto.builder()
                .id(e.getId())
                .date(e.getEventDate() != null ? e.getEventDate().toString() : null)
                .title(e.getTitle())
                .description(e.getDescription())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null)
                .createdById(createdById)
                .createdByName(createdByName)
                .build();
    }

    public void delete(Long eventId) {
        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + eventId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new AccessDeniedException("Unauthenticated");
        }

        Long currentUserId = extractUserId(auth);
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        Long createdById = (event.getCreatedBy() != null ? event.getCreatedBy().getId() : null);
        boolean isCreator = createdById != null && createdById.equals(currentUserId);

        if (!isAdmin && !isCreator) {
            throw new AccessDeniedException("Not allowed to delete this event");
        }

        calendarEventRepository.delete(event);
    }

    private Long extractUserId(Authentication auth) {
        Object p = auth.getPrincipal();
        if (p instanceof Long l) return l;
        if (p instanceof Integer i) return i.longValue();
        if (p instanceof String s) return Long.parseLong(s);
        throw new IllegalStateException("Unsupported principal type: " + p.getClass());
    }

    private String safeFullName(Employee emp) {
        try {
            return emp.getFullName();
        } catch (Exception ignored) {
            return String.valueOf(emp.getId());
        }
    }
}