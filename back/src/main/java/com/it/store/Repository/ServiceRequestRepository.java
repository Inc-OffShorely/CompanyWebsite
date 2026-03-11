package com.it.store.Repository;

import com.it.store.Entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    // Поиск по точному коду
    Optional<ServiceRequest> findByRequestCode(String requestCode);

    // Поиск без учёта регистра (используется в контроллере)
    Optional<ServiceRequest> findFirstByRequestCodeIgnoreCase(String requestCode);
}

