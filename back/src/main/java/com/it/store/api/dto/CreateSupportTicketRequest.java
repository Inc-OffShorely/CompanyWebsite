package com.it.store.api.dto;

public class CreateSupportTicketRequest {

    private Long employeeId;
    private String title;
    private String description;
    private String category;

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {           // ← геттер
        return category;
    }

    public void setCategory(String category) { // ← сеттер
        this.category = category;
    }
}
