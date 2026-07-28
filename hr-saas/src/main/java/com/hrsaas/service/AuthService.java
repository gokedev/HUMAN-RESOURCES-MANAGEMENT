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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class AuthService {

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

    @Transactional
    public AuthResponse registerCompany(RegisterCompanyRequest request) {
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

        return buildAuthResponse(admin, company.getSlug());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Company company = companyRepository.findBySlug(request.getCompanySlug().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> ApiException.unauthorized("Invalid company, email or password"));

        if (!company.isActive()) {
            throw ApiException.forbidden("This company workspace is deactivated");
        }

        User user = userRepository.findByCompanyIdAndEmailIgnoreCase(company.getId(), request.getEmail())
                .orElseThrow(() -> ApiException.unauthorized("Invalid company, email or password"));

        if (user.getStatus() != UserStatus.ACTIVE || user.getPasswordHash() == null) {
            throw ApiException.unauthorized("Account is not active. Check your invitation email.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid company, email or password");
        }

        return buildAuthResponse(user, company.getSlug());
    }

    @Transactional
    public void acceptInvitation(AcceptInvitationRequest request) {
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
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
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

        return buildAuthResponse(user, company.getSlug());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        Company company = companyRepository.findBySlug(request.getCompanySlug().toLowerCase(Locale.ROOT))
                .orElse(null);

        if (company == null) {
            return;
        }

        User user = userRepository.findByCompanyIdAndEmailIgnoreCase(company.getId(), request.getEmail())
                .orElse(null);

        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            return;
        }

        String token = generateSecureToken();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.getId())
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = frontendBaseUrl + "/reset-password?token=" + token;
        mailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetLink);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
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

        refreshTokenRepository.deleteByUserId(user.getId());
    }

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

    private String generateSlug(String companyName) {
        String normalized = companyName.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", "-");
        return SLUG_SANITIZE.matcher(normalized).replaceAll("");
    }

    private String ensureUniqueSlug(String baseSlug) {
        String slug = baseSlug;
        int suffix = 1;
        while (companyRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + suffix;
            suffix++;
        }
        return slug;
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
