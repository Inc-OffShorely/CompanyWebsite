package com.it.store.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CalendarEventDto {
    private Long id;
    private String date;
    private String title;
    private String description;

    private String createdAt;
    private Long createdById;
    private String createdByName;
}