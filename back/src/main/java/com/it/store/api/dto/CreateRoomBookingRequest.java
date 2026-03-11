package com.it.store.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CreateRoomBookingRequest {

    @JsonProperty("roomId")
    private String roomId;

    @JsonProperty("date")
    private String date;

    @JsonProperty("startHour")
    private String startHour;

    @JsonProperty("startMinute")
    private String startMinute;

    @JsonProperty("endHour")
    private String endHour;

    @JsonProperty("endMinute")
    private String endMinute;

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStartHour() {
        return startHour;
    }

    public void setStartHour(String startHour) {
        this.startHour = startHour;
    }

    public String getStartMinute() {
        return startMinute;
    }

    public void setStartMinute(String startMinute) {
        this.startMinute = startMinute;
    }

    public String getEndHour() {
        return endHour;
    }

    public void setEndHour(String endHour) {
        this.endHour = endHour;
    }

    public String getEndMinute() {
        return endMinute;
    }

    public void setEndMinute(String endMinute) {
        this.endMinute = endMinute;
    }
}