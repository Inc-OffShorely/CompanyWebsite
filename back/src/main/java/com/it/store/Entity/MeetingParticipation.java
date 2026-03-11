package com.it.store.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "meeting_participation", schema = "mm")
@IdClass(MeetingParticipationId.class)
public class MeetingParticipation {

    @Id
    @Column(name = "booking_id")
    private Long bookingId;

    @Id
    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "role", nullable = false)
    private String role;

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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}