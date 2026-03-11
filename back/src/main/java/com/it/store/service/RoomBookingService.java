package com.it.store.service;

import com.it.store.Entity.Employee;
import com.it.store.Entity.MeetingParticipation;
import com.it.store.Entity.Room;
import com.it.store.Entity.RoomBooking;
import com.it.store.Repository.EmployeeRepository;
import com.it.store.Repository.MeetingParticipationRepository;
import com.it.store.Repository.RoomBookingRepository;
import com.it.store.Repository.RoomRepository;
import com.it.store.api.dto.CreateRoomBookingRequest;
import com.it.store.api.dto.RoomBookingDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomBookingService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomBookingRepository roomBookingRepository;

    @Autowired
    private MeetingParticipationRepository meetingParticipationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Transactional
    public RoomBookingDto createBooking(CreateRoomBookingRequest req) {
        Employee organizer = currentEmployeeOrThrow();

        Short roomDbId = mapUiRoomIdToDbId(req.getRoomId());
        Room room = roomRepository.findById(roomDbId)
                .orElseThrow(() -> new IllegalArgumentException("Переговорная не найдена: " + req.getRoomId()));

        LocalDate date = LocalDate.parse(req.getDate());

        int sh = Integer.parseInt(req.getStartHour());
        int sm = Integer.parseInt(req.getStartMinute());
        int eh = Integer.parseInt(req.getEndHour());
        int em = Integer.parseInt(req.getEndMinute());

        LocalDateTime startLdt = LocalDateTime.of(date, LocalTime.of(sh, sm));
        LocalDateTime endLdt = LocalDateTime.of(date, LocalTime.of(eh, em));

        if (!endLdt.isAfter(startLdt)) {
            throw new IllegalArgumentException("Время окончания должно быть позже времени начала");
        }

        ZoneId zone = ZoneId.systemDefault();
        OffsetDateTime startAt = startLdt.atZone(zone).toOffsetDateTime();
        OffsetDateTime endAt = endLdt.atZone(zone).toOffsetDateTime();

        var conflicts = roomBookingRepository.findConflicts(roomDbId, startAt, endAt);
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Выбранное время пересекается с существующей бронью");
        }

        RoomBooking booking = new RoomBooking();
        booking.setRoom(room);
        booking.setOrganizer(organizer);
        booking.setStartAt(startAt);
        booking.setEndAt(endAt);
        booking.setStatus("busy");
        booking.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        RoomBooking saved = roomBookingRepository.save(booking);

        MeetingParticipation mp = new MeetingParticipation();
        mp.setBookingId(saved.getId());
        mp.setEmployeeId(organizer.getId());
        mp.setRole("organizer");
        meetingParticipationRepository.save(mp);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<RoomBookingDto> getBookings(String roomId, String dateStr) {
        Short roomDbId = mapUiRoomIdToDbId(roomId);

        ZoneId zone = ZoneId.systemDefault();
        List<RoomBooking> bookings;

        if (dateStr != null && !dateStr.isBlank()) {
            LocalDate date = LocalDate.parse(dateStr);
            OffsetDateTime dayStart = date.atStartOfDay(zone).toOffsetDateTime();
            OffsetDateTime dayEnd = date.plusDays(1).atStartOfDay(zone).toOffsetDateTime();
            bookings = roomBookingRepository.findByRoomAndDay(roomDbId, dayStart, dayEnd);
        } else {
            OffsetDateTime now = OffsetDateTime.now(zone);
            OffsetDateTime farFuture = now.plusYears(1);
            bookings = roomBookingRepository.findByRoomAndDay(roomDbId, now, farFuture);
        }

        return bookings.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private RoomBookingDto toDto(RoomBooking b) {
        RoomBookingDto dto = new RoomBookingDto();
        dto.setId(b.getId());
        dto.setRoomId(mapDbIdToUiRoomId(b.getRoom().getId()));

        ZoneId zone = ZoneId.systemDefault();

        LocalDate date = b.getStartAt().atZoneSameInstant(zone).toLocalDate();
        dto.setDate(date.toString());

        LocalTime start = b.getStartAt().atZoneSameInstant(zone).toLocalTime();
        dto.setStartTime(String.format("%02d:%02d", start.getHour(), start.getMinute()));

        LocalTime end = b.getEndAt().atZoneSameInstant(zone).toLocalTime();
        dto.setEndTime(String.format("%02d:%02d", end.getHour(), end.getMinute()));

        dto.setBookedBy(b.getOrganizer().getFullName());
        dto.setBookedById(b.getOrganizer().getId());
        return dto;
    }

    private Employee currentEmployeeOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Anonymous user");
        }
        Long id = Long.parseLong(auth.getName());
        return employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Current employee not found: " + id));
    }

    private Short mapUiRoomIdToDbId(String roomId) {
        if (roomId == null || roomId.isBlank()) {
            throw new IllegalArgumentException("roomId is required");
        }
        return switch (roomId) {
            case "room-1" -> (short) 1;
            case "room-2" -> (short) 2;
            case "room-3" -> (short) 3;
            default -> throw new IllegalArgumentException("Неизвестная переговорная: " + roomId);
        };
    }

    private String mapDbIdToUiRoomId(Short id) {
        if (id == null) {
            return null;
        }
        return switch (id) {
            case 1 -> "room-1";
            case 2 -> "room-2";
            case 3 -> "room-3";
            default -> "room-" + id;
        };
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;

        return auth.getAuthorities().stream()
                .anyMatch(a -> role.equals(a.getAuthority()));
    }

    @Transactional
    public void deleteBooking(Long bookingId) {
        Employee current = currentEmployeeOrThrow();

        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new IllegalStateException("Бронирование не найдено: " + bookingId)
                );

        boolean isAdmin = hasRole("ROLE_ADMIN");
        boolean isOwner = booking.getOrganizer() != null
                && booking.getOrganizer().getId().equals(current.getId());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Нет прав на удаление этого бронирования");
        }
        meetingParticipationRepository.deleteByBookingId(bookingId);
        roomBookingRepository.delete(booking);
    }

}