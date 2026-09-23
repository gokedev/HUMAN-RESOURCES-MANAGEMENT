package com.hrsaas.service;

import com.hrsaas.dto.AcceptInvitationRequest;
import com.hrsaas.dto.AuthResponse;
import com.hrsaas.dto.ForgotPasswordRequest;
import com.hrsaas.dto.LoginRequest;
import com.hrsaas.dto.RefreshTokenRequest;
import com.hrsaas.dto.RegisterCompanyRequest;
import com.hrsaas.dto.ResetPasswordRequest;
import com.hrsaas.entity.Company;
import com.hrsaas.entity.Invitation;
import com.hrsaas.entity.PasswordResetToken;
import com.hrsaas.entity.RefreshToken;
import com.hrsaas.entity.User;
import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.CompanyRepository;
import com.hrsaas.repository.InvitationRepository;
import com.hrsaas.repository.PasswordResetTokenRepository;
import com.hrsaas.repository.RefreshTokenRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private UserRepository userRepository;
    @Mock private InvitationRepository invitationRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private MailService mailService;

    @InjectMocks
    private AuthService authService;

    private UUID companyId;
    private UUID userId;
    private Company company;
    private User activeUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendBaseUrl", "https://app.example.com");

        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();

        company = Company.builder()
                .id(companyId)
                .name("Acme Inc")
                .slug("acme-inc")
                .isActive(true)
                .build();

        activeUser = User.builder()
                .id(userId)
                .companyId(companyId)
                .email("jane@acme.com")
                .passwordHash("hashed-password")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstName("Jane")
                .lastName("Doe")
                .build();
    }

    // ── registerCompany ────────────────────────────

    @Test
    void registerCompany_Success() {
        RegisterCompanyRequest request = new RegisterCompanyRequest();
        request.setCompanyName("Acme Inc");
        request.setAdminEmail("jane@acme.com");
        request.setAdminPassword("Password1!");
        request.setAdminFirstName("Jane");
        request.setAdminLastName("Doe");

        when(companyRepository.existsBySlug("acme-inc")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenReturn(company);
        when(passwordEncoder.encode("Password1!")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenReturn(activeUser);
        when(jwtService.generateAccessToken(any(), any(), anyString(), anyString()))
                .thenReturn("access-token");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AuthResponse result = authService.registerCompany(request);

        assertNotNull(result);
        assertEquals("access-token", result.getAccessToken());
        assertEquals("acme-inc", result.getCompanySlug());
        assertEquals("ADMIN", result.getRole());
        verify(mailService).sendCompanyWelcomeEmail("jane@acme.com", "Acme Inc", "acme-inc");
        verify(companyRepository).save(any(Company.class));
    }

    @Test
    void registerCompany_SlugCollision_AppendsSuffix() {
        RegisterCompanyRequest request = new RegisterCompanyRequest();
        request.setCompanyName("Acme Inc");
        request.setAdminEmail("jane@acme.com");
        request.setAdminPassword("Password1!");
        request.setAdminFirstName("Jane");
        request.setAdminLastName("Doe");

        when(companyRepository.existsBySlug("acme-inc")).thenReturn(true);
        when(companyRepository.existsBySlug("acme-inc-1")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> inv.getArgument(0));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenReturn(activeUser);
        when(jwtService.generateAccessToken(any(), any(), anyString(), anyString()))
                .thenReturn("access-token");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        authService.registerCompany(request);

        verify(companyRepository).existsBySlug("acme-inc");
        verify(companyRepository).existsBySlug("acme-inc-1");
    }

    // ── login ───────────────────────────────────────

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@acme.com");
        request.setPassword("Password1!");
        request.setCompanySlug("acme-inc");

        when(companyRepository.findBySlug("acme-inc")).thenReturn(Optional.of(company));
        when(userRepository.findByCompanyIdAndEmailIgnoreCase(companyId, "jane@acme.com"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Password1!", "hashed-password")).thenReturn(true);
        when(jwtService.generateAccessToken(any(), any(), anyString(), anyString()))
                .thenReturn("access-token");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AuthResponse result = authService.login(request);

        assertNotNull(result);
        assertEquals("access-token", result.getAccessToken());
        assertEquals("acme-inc", result.getCompanySlug());
    }

    @Test
    void login_UnknownCompanySlug_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@acme.com");
        request.setPassword("Password1!");
        request.setCompanySlug("nope");

        when(companyRepository.findBySlug("nope")).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(org.springframework.http.HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void login_DeactivatedCompany_ThrowsForbidden() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@acme.com");
        request.setPassword("Password1!");
        request.setCompanySlug("acme-inc");

        Company inactive = Company.builder().id(companyId).slug("acme-inc").isActive(false).build();
        when(companyRepository.findBySlug("acme-inc")).thenReturn(Optional.of(inactive));

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void login_PendingUser_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@acme.com");
        request.setPassword("Password1!");
        request.setCompanySlug("acme-inc");

        User pendingUser = User.builder()
                .id(userId).companyId(companyId).email("jane@acme.com")
                .passwordHash(null).status(UserStatus.PENDING).role(Role.EMPLOYEE)
                .firstName("Jane").lastName("Doe")
                .build();

        when(companyRepository.findBySlug("acme-inc")).thenReturn(Optional.of(company));
        when(userRepository.findByCompanyIdAndEmailIgnoreCase(companyId, "jane@acme.com"))
                .thenReturn(Optional.of(pendingUser));

        assertThrows(ApiException.class, () -> authService.login(request));
    }

    @Test
    void login_WrongPassword_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@acme.com");
        request.setPassword("WrongPassword1!");
        request.setCompanySlug("acme-inc");

        when(companyRepository.findBySlug("acme-inc")).thenReturn(Optional.of(company));
        when(userRepository.findByCompanyIdAndEmailIgnoreCase(companyId, "jane@acme.com"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("WrongPassword1!", "hashed-password")).thenReturn(false);

        assertThrows(ApiException.class, () -> authService.login(request));
        verify(jwtService, never()).generateAccessToken(any(), any(), anyString(), anyString());
    }

    // ── acceptInvitation ────────────────────────────

    @Test
    void acceptInvitation_Success() {
        AcceptInvitationRequest request = new AcceptInvitationRequest();
        request.setToken("invite-token");
        request.setPassword("NewPassword1!");

        Invitation invitation = Invitation.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .userId(userId)
                .token("invite-token")
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();

        User pendingUser = User.builder()
                .id(userId).companyId(companyId).email("jane@acme.com")
                .status(UserStatus.PENDING).role(Role.EMPLOYEE)
                .firstName("Jane").lastName("Doe")
                .build();

        when(invitationRepository.findByToken("invite-token")).thenReturn(Optional.of(invitation));
        when(userRepository.findById(userId)).thenReturn(Optional.of(pendingUser));
        when(passwordEncoder.encode("NewPassword1!")).thenReturn("new-hash");

        authService.acceptInvitation(request);

        assertEquals(UserStatus.ACTIVE, pendingUser.getStatus());
        assertEquals("new-hash", pendingUser.getPasswordHash());
        verify(userRepository).save(pendingUser);
        verify(invitationRepository).save(invitation);
        assertNotNull(invitation.getAcceptedAt());
    }

    @Test
    void acceptInvitation_UnknownToken_ThrowsBadRequest() {
        AcceptInvitationRequest request = new AcceptInvitationRequest();
        request.setToken("bad-token");
        request.setPassword("NewPassword1!");

        when(invitationRepository.findByToken("bad-token")).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> authService.acceptInvitation(request));
    }

    @Test
    void acceptInvitation_AlreadyAccepted_ThrowsBadRequest() {
        AcceptInvitationRequest request = new AcceptInvitationRequest();
        request.setToken("invite-token");
        request.setPassword("NewPassword1!");

        Invitation invitation = Invitation.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .userId(userId)
                .token("invite-token")
                .expiresAt(LocalDateTime.now().plusDays(1))
                .acceptedAt(LocalDateTime.now().minusHours(1))
                .build();

        when(invitationRepository.findByToken("invite-token")).thenReturn(Optional.of(invitation));

        assertThrows(ApiException.class, () -> authService.acceptInvitation(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void acceptInvitation_Expired_ThrowsBadRequest() {
        AcceptInvitationRequest request = new AcceptInvitationRequest();
        request.setToken("invite-token");
        request.setPassword("NewPassword1!");

        Invitation invitation = Invitation.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .userId(userId)
                .token("invite-token")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();

        when(invitationRepository.findByToken("invite-token")).thenReturn(Optional.of(invitation));

        assertThrows(ApiException.class, () -> authService.acceptInvitation(request));
    }

    // ── refreshToken ────────────────────────────────

    @Test
    void refreshToken_Success() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid-token");

        RefreshToken existing = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("valid-token")
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(existing));
        when(userRepository.findById(userId)).thenReturn(Optional.of(activeUser));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(jwtService.generateAccessToken(any(), any(), anyString(), anyString()))
                .thenReturn("new-access-token");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AuthResponse result = authService.refreshToken(request);

        assertNotNull(result);
        assertEquals("new-access-token", result.getAccessToken());
        assertTrue(existing.isRevoked());
    }

    @Test
    void refreshToken_ExpiredOrRevoked_ThrowsUnauthorized() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("expired-token");

        RefreshToken expired = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("expired-token")
                .expiresAt(LocalDateTime.now().minusMinutes(5))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expired));

        assertThrows(ApiException.class, () -> authService.refreshToken(request));
    }

    @Test
    void refreshToken_UnknownToken_ThrowsUnauthorized() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("nope");

        when(refreshTokenRepository.findByToken("nope")).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> authService.refreshToken(request));
    }

    @Test
    void refreshToken_InactiveUser_ThrowsUnauthorized() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid-token");

        RefreshToken existing = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("valid-token")
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();

        User suspended = User.builder()
                .id(userId).companyId(companyId).email("jane@acme.com")
                .status(UserStatus.SUSPENDED).role(Role.ADMIN)
                .firstName("Jane").lastName("Doe")
                .build();

        when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(existing));
        when(userRepository.findById(userId)).thenReturn(Optional.of(suspended));

        assertThrows(ApiException.class, () -> authService.refreshToken(request));
    }

    // ── forgotPassword ──────────────────────────────

    @Test
    void forgotPassword_ValidUser_SendsResetEmail() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("jane@acme.com");
        request.setCompanySlug("acme-inc");

        when(companyRepository.findBySlug("acme-inc")).thenReturn(Optional.of(company));
        when(userRepository.findByCompanyIdAndEmailIgnoreCase(companyId, "jane@acme.com"))
                .thenReturn(Optional.of(activeUser));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        authService.forgotPassword(request);

        verify(mailService).sendPasswordResetEmail(eq("jane@acme.com"), eq("Jane"), anyString());
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void forgotPassword_UnknownCompany_NoOpNoException() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("jane@acme.com");
        request.setCompanySlug("ghost-co");

        when(companyRepository.findBySlug("ghost-co")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> authService.forgotPassword(request));
        verify(mailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void forgotPassword_UnknownUser_NoOpNoException() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("ghost@acme.com");
        request.setCompanySlug("acme-inc");

        when(companyRepository.findBySlug("acme-inc")).thenReturn(Optional.of(company));
        when(userRepository.findByCompanyIdAndEmailIgnoreCase(companyId, "ghost@acme.com"))
                .thenReturn(Optional.empty());

        assertDoesNotThrow(() -> authService.forgotPassword(request));
        verify(mailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    // ── resetPassword ───────────────────────────────

    @Test
    void resetPassword_Success() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("reset-token");
        request.setNewPassword("BrandNew1!");

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("reset-token")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(resetToken));
        when(userRepository.findById(userId)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.encode("BrandNew1!")).thenReturn("new-hash");

        authService.resetPassword(request);

        assertEquals("new-hash", activeUser.getPasswordHash());
        assertNotNull(resetToken.getUsedAt());
        verify(refreshTokenRepository).deleteByUserId(userId);
    }

    @Test
    void resetPassword_AlreadyUsed_ThrowsBadRequest() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("reset-token");
        request.setNewPassword("BrandNew1!");

        PasswordResetToken usedToken = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("reset-token")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .usedAt(LocalDateTime.now().minusMinutes(5))
                .build();

        when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(usedToken));

        assertThrows(ApiException.class, () -> authService.resetPassword(request));
    }

    @Test
    void resetPassword_Expired_ThrowsBadRequest() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("reset-token");
        request.setNewPassword("BrandNew1!");

        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("reset-token")
                .expiresAt(LocalDateTime.now().minusMinutes(5))
                .build();

        when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(expiredToken));

        assertThrows(ApiException.class, () -> authService.resetPassword(request));
    }

    // ── updatePassword ──────────────────────────────

    @Test
    void updatePassword_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("oldPass1!", "hashed-password")).thenReturn(true);
        when(passwordEncoder.encode("newPass1!")).thenReturn("new-hash");

        authService.updatePassword(userId, "oldPass1!", "newPass1!");

        assertEquals("new-hash", activeUser.getPasswordHash());
        verify(refreshTokenRepository).deleteByUserId(userId);
    }

    @Test
    void updatePassword_WrongCurrentPassword_ThrowsBadRequest() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongPass", "hashed-password")).thenReturn(false);

        assertThrows(ApiException.class,
                () -> authService.updatePassword(userId, "wrongPass", "newPass1!"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void updatePassword_BlankNewPassword_ThrowsBadRequest() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("oldPass1!", "hashed-password")).thenReturn(true);

        assertThrows(ApiException.class,
                () -> authService.updatePassword(userId, "oldPass1!", "   "));
    }

    @Test
    void updatePassword_UnknownUser_ThrowsNotFound() {
        UUID ghostId = UUID.randomUUID();
        when(userRepository.findById(ghostId)).thenReturn(Optional.empty());

        assertThrows(ApiException.class,
                () -> authService.updatePassword(ghostId, "oldPass1!", "newPass1!"));
    }
}
