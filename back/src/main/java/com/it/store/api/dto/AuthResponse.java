package com.it.store.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class AuthResponse {

    private Long id;
    private String login;
    private String name;
    private String email;

    @JsonProperty("position_title")
    private String positionTitle;

    private String role;
    private String token;

    private List<String> roles;

    @JsonProperty("can_manage_documents")
    private Boolean canManageDocuments;

    public AuthResponse() {
    }

    public AuthResponse(
            Long id,
            String login,
            String name,
            String email,
            String positionTitle,
            String role,
            String token,
            List<String> roles
    ) {
        this.id = id;
        this.login = login;
        this.name = name;
        this.email = email;
        this.positionTitle = positionTitle;
        this.role = role;
        this.token = token;
        this.roles = roles;
    }

    // ===== getters / setters =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public Boolean getCanManageDocuments() { return canManageDocuments; }
    public void setCanManageDocuments(Boolean canManageDocuments) {
        this.canManageDocuments = canManageDocuments;
    }
}