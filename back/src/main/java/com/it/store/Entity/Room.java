package com.it.store.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "room", schema = "mm")
@Getter
@Setter
public class Room {

    @Id
    @Column(name = "room_id")
    private Short id;

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;
}