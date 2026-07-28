package com.hrsaas.repository;

import com.hrsaas.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, java.util.UUID> {
    Optional<PasswordResetToken> findByToken(String token);
}
