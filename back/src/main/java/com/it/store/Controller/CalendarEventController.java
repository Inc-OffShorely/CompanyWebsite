package com.it.store.Controller;

import com.it.store.api.dto.CalendarEventDto;
import com.it.store.api.dto.CreateCalendarEventRequest;
import com.it.store.service.CalendarEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/calendar")
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    @GetMapping("/events/{date}")
    public List<CalendarEventDto> getByDate(@PathVariable String date) {
        return calendarEventService.getByDate(date);
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        calendarEventService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/events")
    public List<CalendarEventDto> getRange(@RequestParam String from, @RequestParam String to) {
        return calendarEventService.getRange(from, to);
    }

    @PostMapping("/events")
    public CalendarEventDto create(@RequestBody CreateCalendarEventRequest request) {
        return calendarEventService.create(request);
    }
}