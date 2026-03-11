package com.it.store.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "role", schema = "mm")
public class Role {

    @Id
    @Column(name = "role_id")
    private Short id;

    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    public Short getId() { return id; }
    public void setId(Short id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}