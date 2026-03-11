package com.it.store.Entity;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import java.time.OffsetDateTime;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.Set;
import java.util.HashSet;
import com.it.store.Entity.Role;

@Entity
@Table(name = "employee", schema = "mm")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Long id;

    @Column(name = "login", nullable = false, length = 8)
    private String login;

    @JsonProperty("full_name")
    @Column(name = "full_name", nullable = false)
    private String full_name;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @JsonProperty("passport_data")
    @Column(name = "passport_data")
    private String passportData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "contacts")
    private Map<String, String> contacts;

    @JsonProperty("birth_date")
    @Column(name = "birth_date")
    private LocalDate birthDate;

    @JsonProperty("hired_at")
    @Column(name = "hired_at")
    private LocalDateTime hiredAt;

    @JsonProperty("position_title")
    @Column(name = "position_title")
    private String positionTitle;

    @Column(name = "has_active_session", nullable = false)
    private boolean hasActiveSession;

    @JsonProperty("last_activity_at")
    @Column(name = "last_activity_at")
    private java.time.OffsetDateTime lastActivityAt;

    @JsonProperty("can_manage_documents")
    @Column(name = "can_manage_documents")
    private Boolean canManageDocuments;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "employee_role",
            schema = "mm",
            joinColumns = @JoinColumn(name = "employee_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    public boolean isHasActiveSession() { return hasActiveSession; }
    public void setHasActiveSession(boolean v) { this.hasActiveSession = v; }

    public OffsetDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(OffsetDateTime v) { this.lastActivityAt = v; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "password_hash",  nullable = false)
    private String passwordHash;

    public Employee() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }
    public String getFullName() { return full_name; }
    public void setFullName(String full_name) { this.full_name = full_name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassportData() { return passportData; }
    public void setPassportData(String passportData) { this.passportData = passportData; }
    public Map<String, String> getContacts() {
        return contacts;
    }

    public void setContacts(Map<String, String> contacts) {
        this.contacts = contacts;
    }
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public LocalDateTime getHiredAt() { return hiredAt; }
    public void setHiredAt(LocalDateTime hiredAt) { this.hiredAt = hiredAt; }
    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Boolean getCanManageDocuments() {
        return canManageDocuments;
    }

    public void setCanManageDocuments(Boolean canManageDocuments) {
        this.canManageDocuments = canManageDocuments;
    }
}