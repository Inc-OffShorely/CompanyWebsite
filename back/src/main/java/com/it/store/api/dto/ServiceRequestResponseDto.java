package com.it.store.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class ServiceRequestResponseDto {

    @JsonProperty("requestCode")
    private String requestCode;

    @JsonProperty("serviceName")
    private String serviceName;

    @JsonProperty("customerName")
    private String customerName;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("email")
    private String email;

    @JsonProperty("createdAt")
    private Instant createdAt;

    @JsonProperty("status")
    private String status;

    @JsonProperty("comment")
    private String comment;

    @JsonProperty("size")
    private String size;

    public ServiceRequestResponseDto(String requestCode,
                                     String serviceName,
                                     String customerName,
                                     String phone,
                                     String email,
                                     Instant createdAt,
                                     String status,
                                     String size) {
        this.requestCode = requestCode;
        this.serviceName = serviceName;
        this.customerName = customerName;
        this.phone = phone;
        this.email = email;
        this.createdAt = createdAt;
        this.status = status;
        this.size = size;
    }

    public String getRequestCode() {
        return requestCode;
    }

    public void setRequestCode(String requestCode) {
        this.requestCode = requestCode;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }
}