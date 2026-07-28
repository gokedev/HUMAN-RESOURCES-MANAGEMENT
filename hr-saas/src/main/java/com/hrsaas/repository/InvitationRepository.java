package com.hrsaas.repository;

import com.hrsaas.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    Optional<Invitation> findByToken(String token);
    Optional<Invitation> findByUserIdAndAcceptedAtIsNull(UUID userId);
}
