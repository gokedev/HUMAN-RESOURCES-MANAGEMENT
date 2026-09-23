package com.hrsaas.repository;

import com.hrsaas.entity.RefreshToken;
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
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    void findByToken_ReturnsMatchingToken() {
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(UUID.randomUUID()).token("rt-123")
                .expiresAt(LocalDateTime.now().plusDays(7)).revoked(false).build());

        Optional<RefreshToken> found = refreshTokenRepository.findByToken("rt-123");

        assertThat(found).isPresent();
        assertThat(found.get().isRevoked()).isFalse();
    }

    @Test
    void findByToken_UnknownToken_ReturnsEmpty() {
        assertThat(refreshTokenRepository.findByToken("nope")).isEmpty();
    }

    @Test
    void deleteByUserId_RemovesAllTokensForThatUser() {
        UUID userId = UUID.randomUUID();
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(userId).token("rt-a").expiresAt(LocalDateTime.now().plusDays(1)).revoked(false).build());
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(userId).token("rt-b").expiresAt(LocalDateTime.now().plusDays(1)).revoked(false).build());
        UUID otherUserId = UUID.randomUUID();
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(otherUserId).token("rt-c").expiresAt(LocalDateTime.now().plusDays(1)).revoked(false).build());

        refreshTokenRepository.deleteByUserId(userId);

        assertThat(refreshTokenRepository.findByToken("rt-a")).isEmpty();
        assertThat(refreshTokenRepository.findByToken("rt-b")).isEmpty();
        assertThat(refreshTokenRepository.findByToken("rt-c")).isPresent();
    }
}
