package com.it.store.Repository;

import com.it.store.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    @Query(
            value = "select * from mm.client c " +
                    "where c.full_name = :fullName " +
                    "  and c.contacts->>'phone' = :phone " +
                    "  and c.contacts->>'email' = :email " +
                    "limit 1",
            nativeQuery = true
    )
    Optional<Client> findByFullNameAndContacts(
            @Param("fullName") String fullName,
            @Param("phone") String phone,
            @Param("email") String email
    );
}