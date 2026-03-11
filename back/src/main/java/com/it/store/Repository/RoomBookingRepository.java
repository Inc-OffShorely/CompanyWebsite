package com.it.store.Repository;

import com.it.store.Entity.RoomBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface RoomBookingRepository extends JpaRepository<RoomBooking, Long> {

    @Query("""
           select b from RoomBooking b
           where b.room.id = :roomId
             and b.startAt < :endAt
             and b.endAt > :startAt
           """)
    List<RoomBooking> findConflicts(@Param("roomId") Short roomId,
                                    @Param("startAt") OffsetDateTime startAt,
                                    @Param("endAt") OffsetDateTime endAt);

    @Query("""
           select b from RoomBooking b
           where b.room.id = :roomId
             and b.startAt >= :dayStart
             and b.startAt < :dayEnd
           order by b.startAt
           """)
    List<RoomBooking> findByRoomAndDay(@Param("roomId") Short roomId,
                                       @Param("dayStart") OffsetDateTime dayStart,
                                       @Param("dayEnd") OffsetDateTime dayEnd);
}