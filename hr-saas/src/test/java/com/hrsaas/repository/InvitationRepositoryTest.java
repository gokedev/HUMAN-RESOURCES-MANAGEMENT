package com.hrsaas.repository;

import com.hrsaas.entity.Invitation;
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
class InvitationRepositoryTest {

    @Autowired
    private InvitationRepository invitationRepository;

    @Test
    void findByToken_ReturnsMatchingInvitation() {
        invitationRepository.save(Invitation.builder()
                .companyId(UUID.randomUUID()).userId(UUID.randomUUID())
                .token("tok-123").expiresAt(LocalDateTime.now().plusDays(1)).build());

        Optional<Invitation> found = invitationRepository.findByToken("tok-123");

        assertThat(found).isPresent();
    }

    @Test
    void findByToken_UnknownToken_ReturnsEmpty() {
        assertThat(invitationRepository.findByToken("nope")).isEmpty();
    }

    @Test
    void findByUserIdAndAcceptedAtIsNull_OnlyReturnsPendingInvite() {
        UUID userId = UUID.randomUUID();
        invitationRepository.save(Invitation.builder()
                .companyId(UUID.randomUUID()).userId(userId)
                .token("tok-pending").expiresAt(LocalDateTime.now().plusDays(1)).build());

        Optional<Invitation> found = invitationRepository.findByUserIdAndAcceptedAtIsNull(userId);

        assertThat(found).isPresent();
        assertThat(found.get().getAcceptedAt()).isNull();
    }

    @Test
    void findByUserIdAndAcceptedAtIsNull_AlreadyAccepted_ReturnsEmpty() {
        UUID userId = UUID.randomUUID();
        invitationRepository.save(Invitation.builder()
                .companyId(UUID.randomUUID()).userId(userId)
                .token("tok-accepted").expiresAt(LocalDateTime.now().plusDays(1))
                .acceptedAt(LocalDateTime.now()).build());

        assertThat(invitationRepository.findByUserIdAndAcceptedAtIsNull(userId)).isEmpty();
    }
}
