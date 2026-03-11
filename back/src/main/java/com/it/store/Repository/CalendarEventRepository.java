package com.it.store.Repository;

import com.it.store.Entity.CalendarEvent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    @EntityGraph(attributePaths = "createdBy")
    List<CalendarEvent> findByEventDateOrderByCreatedAtAsc(LocalDate eventDate);

    @EntityGraph(attributePaths = "createdBy")
    @Query("""
           select e from CalendarEvent e
           where e.eventDate between :from and :to
           order by e.eventDate asc, e.createdAt asc
           """)
    List<CalendarEvent> findRange(@Param("from") LocalDate from, @Param("to") LocalDate to);
}