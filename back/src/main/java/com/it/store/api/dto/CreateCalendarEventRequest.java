package com.it.store.api.dto;

import lombok.Data;

@Data
public class CreateCalendarEventRequest {
    private String date;
    private String title;
    private String description;
}