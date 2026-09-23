package com.hrsaas.repository;

import com.hrsaas.entity.PasswordResetToken;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class PasswordResetTokenRepositoryTest {

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Test
    void findByToken_ReturnsMatchingToken() {
        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .userId(UUID.randomUUID()).token("prt-123")
                .expiresAt(LocalDateTime.now().plusHours(1)).build());

        Optional<PasswordResetToken> found = passwordResetTokenRepository.findByToken("prt-123");

        assertThat(found).isPresent();
        assertThat(found.get().getUsedAt()).isNull();
    }

    @Test
    void findByToken_UnknownToken_ReturnsEmpty() {
        assertThat(passwordResetTokenRepository.findByToken("nope")).isEmpty();
    }

    @Test
    void tokenMustBeUnique_ThrowsOnDuplicate() {
        passwordResetTokenRepository.saveAndFlush(PasswordResetToken.builder()
                .userId(UUID.randomUUID()).token("dup-token")
                .expiresAt(LocalDateTime.now().plusHours(1)).build());

        org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
                passwordResetTokenRepository.saveAndFlush(PasswordResetToken.builder()
                        .userId(UUID.randomUUID()).token("dup-token")
                        .expiresAt(LocalDateTime.now().plusHours(1)).build()));
    }
}
