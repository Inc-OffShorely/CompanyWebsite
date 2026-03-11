package com.it.store.api.dto;

import java.time.Instant;

public class ServiceRequestListItemDto {
    private Long id;
    private String requestCode;
    private String serviceName;
    private Short serviceTypeId;
    private String customerName;
    private String phone;
    private String email;
    private String status;   // accepted / in_progress / completed / rejected
    private String size;     // S / M / XL и т.п.
    private String comment;
    private Instant createdAt;
    private Instant completedAt;
    private Long assigneeId;       // сотрудник, на которого назначена заявка
    private String assigneeName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRequestCode() { return requestCode; }
    public void setRequestCode(String requestCode) { this.requestCode = requestCode; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public Short getServiceTypeId() { return serviceTypeId; }
    public void setServiceTypeId(Short serviceTypeId) { this.serviceTypeId = serviceTypeId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }

    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }
}
