package com.it.store.Controller;

import com.it.store.api.dto.CreateRoomBookingRequest;
import com.it.store.api.dto.RoomBookingDto;
import com.it.store.service.RoomBookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/room-bookings")
public class RoomBookingController {

    private static final Logger log = LoggerFactory.getLogger(RoomBookingController.class);

    private final RoomBookingService roomBookingService;

    public RoomBookingController(RoomBookingService roomBookingService) {
        this.roomBookingService = roomBookingService;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            roomBookingService.deleteBooking(id);
            return ResponseEntity.noContent().build();
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error", "forbidden",
                            "message", ex.getMessage()
                    ));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "not_found",
                            "message", ex.getMessage()
                    ));
        } catch (Exception ex) {
            log.error("Ошибка при удалении бронирования", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "internal_error",
                            "message", "Ошибка при удалении бронирования"
                    ));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateRoomBookingRequest request) {
        try {
            RoomBookingDto dto = roomBookingService.createBooking(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);

        } catch (AccessDeniedException ex) {
            // нет аутентификации / прав
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "unauthorized",
                            "message", "Пользователь не авторизован"
                    ));

        } catch (IllegalArgumentException ex) {
            // любые проверки: дата/время/пересечение/roomId и пр.
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "validation_error",
                            "message", ex.getMessage()
                    ));

        } catch (Exception ex) {
            log.error("Ошибка при создании бронирования", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "internal_error",
                            "message", "Внутренняя ошибка сервера при создании бронирования"
                    ));
        }
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam("roomId") String roomId,
            @RequestParam(value = "date", required = false) String date
    ) {
        try {
            List<RoomBookingDto> bookings = roomBookingService.getBookings(roomId, date);
            return ResponseEntity.ok(bookings);

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "validation_error",
                            "message", ex.getMessage()
                    ));
        } catch (Exception ex) {
            log.error("Ошибка при получении списка бронирований", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "internal_error",
                            "message", "Внутренняя ошибка сервера при получении бронирований"
                    ));
        }
    }
}