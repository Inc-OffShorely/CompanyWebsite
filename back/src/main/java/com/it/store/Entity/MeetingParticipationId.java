package com.it.store.Entity;

import java.io.Serializable;
import java.util.Objects;

public class MeetingParticipationId implements Serializable {

    private Long bookingId;
    private Long employeeId;

    public MeetingParticipationId() {
    }

    public MeetingParticipationId(Long bookingId, Long employeeId) {
        this.bookingId = bookingId;
        this.employeeId = employeeId;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MeetingParticipationId that)) return false;
        return Objects.equals(bookingId, that.bookingId)
                && Objects.equals(employeeId, that.employeeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(bookingId, employeeId);
    }
}