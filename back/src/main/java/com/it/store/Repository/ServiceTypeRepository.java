package com.it.store.Repository;

import com.it.store.Entity.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceTypeRepository extends JpaRepository<ServiceType, Short> {
    Optional<ServiceType> findByName(String name);
}