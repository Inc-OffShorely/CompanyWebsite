package com.it.store.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import java.util.List;

public class EmployeeAdminDto {
    public Long id;
    public String login;
    public String email;

    @JsonProperty("full_name")
    public String fullName;

    @JsonProperty("position_title")
    public String positionTitle;

    @JsonProperty("passport_data")
    public String passportData;

    @JsonProperty("birth_date")
    public String birthDate;

    @JsonProperty("hired_at")
    public String hiredAt;

    @JsonProperty("last_activity_at")
    public OffsetDateTime lastActivityAt;

    @JsonProperty("can_manage_documents")
    public Boolean canManageDocuments;

    public ContactsDto contacts;
    public List<RoleDto> roles;

    public static class ContactsDto {
        public String phone;
        public String telegram;
    }

    public static class RoleDto {
        public String code;
        public String name;
    }
}