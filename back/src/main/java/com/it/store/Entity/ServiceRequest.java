package com.it.store.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "service_request", schema = "mm")
@Getter
@Setter
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "service_type_id", nullable = false)
    private Short serviceTypeId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "external_code")
    private String externalCode;

    @Column(name = "comment")
    private String comment;

    @Column(name = "size")
    private String size;

    @Column(name = "request_code", nullable = false)
    private String requestCode;
}