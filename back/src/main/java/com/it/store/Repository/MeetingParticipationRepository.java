package com.it.store.Repository;

import com.it.store.Entity.MeetingParticipation;
import com.it.store.Entity.MeetingParticipationId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MeetingParticipationRepository extends JpaRepository<MeetingParticipation, MeetingParticipationId> {
    void deleteByBookingId(Long bookingId);
}