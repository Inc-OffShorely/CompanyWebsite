package com.it.store.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RoomBookingDto {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("roomId")
    private String roomId;

    @JsonProperty("date")
    private String date;

    @JsonProperty("startTime")
    private String startTime;

    @JsonProperty("endTime")
    private String endTime;

    @JsonProperty("bookedBy")
    private String bookedBy;

    @JsonProperty("bookedById")
    private Long bookedById;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getBookedBy() { return bookedBy; }
    public void setBookedBy(String bookedBy) { this.bookedBy = bookedBy; }

    public Long getBookedById() { return bookedById; }
    public void setBookedById(Long bookedById) { this.bookedById = bookedById; }
}