package com.it.store.Repository;

import com.it.store.Entity.Employee;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // деактивация неактивных сессий — для SessionJanitor
    @Transactional
    @Modifying
    @Query("update Employee e set e.hasActiveSession = false " +
            "where e.hasActiveSession = true " +
            "and e.lastActivityAt < :threshold")
    void deactivateIdleSessions(@Param("threshold") OffsetDateTime threshold);

    @EntityGraph(attributePaths = {"roles"})
    List<Employee> findAll();

    Optional<Employee> findByLogin(String login);
    @Transactional
    @Modifying
    @Query(
            value = "UPDATE mm.employee SET has_active_session = :val WHERE employee_id = :id",
            nativeQuery = true
    )
    void updateHasActiveSession(@Param("id") Long employeeId,
                                @Param("val") boolean val);

    @Transactional
    @Modifying
    @Query(
            value = "UPDATE mm.employee " +
                    "SET last_activity_at = :ts " +
                    "WHERE employee_id = :id",
            nativeQuery = true
    )
    void updateLastActivity(@Param("id") Long employeeId,
                            @Param("ts") OffsetDateTime ts);

    @Transactional
    @Modifying
    @Query("update Employee e set e.canManageDocuments = :val where e.id = :id")
    void updateDocsPermission(@Param("id") Long id, @Param("val") boolean val);
}