package com.hrsaas.service;

import com.hrsaas.dto.AcceptInvitationRequest;
import com.hrsaas.dto.AuthResponse;
import com.hrsaas.dto.ForgotPasswordRequest;
import com.hrsaas.dto.LoginRequest;
import com.hrsaas.dto.RefreshTokenRequest;
import com.hrsaas.dto.RegisterCompanyRequest;
import com.hrsaas.dto.ResetPasswordRequest;
import com.hrsaas.dto.UpdatePasswordRequest;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Handles all authentication: registration, login, token refresh,
 * invitations, password reset, and password change.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    private static final Pattern SLUG_SANITIZE = Pattern.compile("[^a-z0-9-]");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public AuthService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            InvitationRepository invitationRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            MailService mailService
    ) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }

    // ── Company registration ──────────────────────

    /** Creates a new company + admin user, sends welcome email, returns tokens. */
    @Transactional
    public AuthResponse registerCompany(RegisterCompanyRequest request) {
        log.info("Registering new company: name={}", request.getCompanyName());
        String baseSlug = generateSlug(request.getCompanyName());
        String slug = ensureUniqueSlug(baseSlug);

        Company company = Company.builder()
                .name(request.getCompanyName())
                .slug(slug)
                .industry(request.getIndustry())
                .country(request.getCountry())
                .isActive(true)
                .build();
        company = companyRepository.save(company);

        User admin = User.builder()
                .companyId(company.getId())
                .email(request.getAdminEmail().toLowerCase(Locale.ROOT))
                .passwordHash(passwordEncoder.encode(request.getAdminPassword()))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstName(request.getAdminFirstName())
                .lastName(request.getAdminLastName())
                .build();
        admin = userRepository.save(admin);

        mailService.sendCompanyWelcomeEmail(admin.getEmail(), company.getName(), company.getSlug());

        log.info("Company registered: id={}, slug={}", company.getId(), slug);
        return buildAuthResponse(admin, company.getSlug());
    }

    // ── Login ─────────────────────────────────────

    /**
     * Authenticates user within a company workspace.
     * Resolves company by slug, verifies email + password, returns tokens.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail();
        String companySlug = request.getCompanySlug().toLowerCase(Locale.ROOT);
        log.info("Login attempt: email={}, companySlug={}", email, companySlug);

        Company company = companyRepository.findBySlug(companySlug)
                .orElseThrow(() -> ApiException.unauthorized("Invalid company, email or password"));

        if (!company.isActive()) {
            throw ApiException.forbidden("This company workspace is deactivated");
        }

        User user = userRepository.findByCompanyIdAndEmailIgnoreCase(company.getId(), email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid company, email or password"));

        // PENDING users haven't accepted their invite yet — no password set
        if (user.getStatus() != UserStatus.ACTIVE || user.getPasswordHash() == null) {
            throw ApiException.unauthorized("Account is not active. Check your invitation email.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid company, email or password");
        }

        log.info("Login successful: userId={}, company={}", user.getId(), companySlug);
        return buildAuthResponse(user, company.getSlug());
    }

    // ── Invitation acceptance ─────────────────────

    /**
     * Employee sets their password via the invite link.
     * Validates token (exists, unused, not expired), activates the account.
     */
    @Transactional
    public void acceptInvitation(AcceptInvitationRequest request) {
        log.info("Accepting invitation with token");
        Invitation invitation = invitationRepository.findByToken(request.getToken())
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired invitation"));

        if (invitation.getAcceptedAt() != null) {
            throw ApiException.badRequest("This invitation has already been used");
        }
        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("This invitation has expired");
        }

        User user = userRepository.findById(invitation.getUserId())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        log.info("Invitation accepted: userId={}", user.getId());
    }

    // ── Refresh token rotation ────────────────────

    /** Exchanges a valid refresh token for a new access+refresh pair. Old token is revoked. */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        log.info("Token refresh attempt");
        RefreshToken existing = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        if (existing.isRevoked() || existing.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.unauthorized("Refresh token is expired or revoked");
        }

        User user = userRepository.findById(existing.getUserId())
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.unauthorized("Account is not active");
        }

        Company company = companyRepository.findById(user.getCompanyId())
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        existing.setRevoked(true);
        refreshTokenRepository.save(existing);

        log.info("Token refreshed: userId={}", user.getId());
        return buildAuthResponse(user, company.getSlug());
    }

    // ── Forgot password ───────────────────────────

    /**
     * Generates a reset token and emails a reset link.
     * Always returns 200 OK (prevents email enumeration).
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String companySlug = request.getCompanySlug().toLowerCase(Locale.ROOT);
        log.info("Password reset requested for email={} in company={}", request.getEmail(), companySlug);

        Company company = companyRepository.findBySlug(companySlug).orElse(null);
        if (company == null) return;

        User user = userRepository.findByCompanyIdAndEmailIgnoreCase(company.getId(), request.getEmail()).orElse(null);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) return;

        String token = generateSecureToken();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.getId())
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = frontendBaseUrl + "/reset-password?token=" + token;
        mailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetLink);

        log.info("Password reset token created: userId={}", user.getId());
    }

    // ── Reset password ────────────────────────────

    /** Validates reset token, updates password, revokes all refresh tokens. */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Password reset attempt with token");
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired reset link"));

        if (resetToken.getUsedAt() != null) {
            throw ApiException.badRequest("This reset link has already been used");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("This reset link has expired");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        // Force re-login on all devices
        refreshTokenRepository.deleteByUserId(user.getId());

        log.info("Password reset completed: userId={}", user.getId());
    }

    // ── Password change (self-service) ────────────

    /** Verifies current password, sets new one, revokes all refresh tokens. */
    @Transactional
    public void updatePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw ApiException.badRequest("New password cannot be empty");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        refreshTokenRepository.deleteByUserId(userId);
        log.info("Password updated: userId={}", userId);
    }

    // ── Helpers ───────────────────────────────────

    /** Builds JWT access token + refresh token, packages with user metadata. */
    private AuthResponse buildAuthResponse(User user, String companySlug) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getCompanyId(), user.getRole().name(), user.getEmail()
        );

        String refreshTokenValue = generateSecureToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .role(user.getRole().name())
                .email(user.getEmail())
                .companySlug(companySlug)
                .build();
    }

    /** Converts company name to a URL-friendly slug (lowercase, hyphens). */
    private String generateSlug(String companyName) {
        String normalized = companyName.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", "-");
        return SLUG_SANITIZE.matcher(normalized).replaceAll("");
    }

    /** Appends -1, -2, etc. until the slug is unique. */
    private String ensureUniqueSlug(String baseSlug) {
        String slug = baseSlug;
        int suffix = 1;
        while (companyRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + suffix;
            suffix++;
        }
        return slug;
    }

    /** Generates a cryptographically secure random token (48 bytes, base64url). */
    private String generateSecureToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
