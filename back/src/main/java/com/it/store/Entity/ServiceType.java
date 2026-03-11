package com.it.store.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "service_type", schema = "mm")
public class ServiceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_type_id")
    private Short serviceTypeId;

    @Column(name = "name", nullable = false)
    private String name;

    public Short getServiceTypeId() {
        return serviceTypeId;
    }

    public void setServiceTypeId(Short serviceTypeId) {
        this.serviceTypeId = serviceTypeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}