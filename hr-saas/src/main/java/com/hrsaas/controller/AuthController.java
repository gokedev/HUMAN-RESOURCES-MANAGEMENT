package com.hrsaas.controller;

import com.hrsaas.dto.AcceptInvitationRequest;
import com.hrsaas.dto.AuthResponse;
import com.hrsaas.dto.ForgotPasswordRequest;
import com.hrsaas.dto.LoginRequest;
import com.hrsaas.dto.RefreshTokenRequest;
import com.hrsaas.dto.RegisterCompanyRequest;
import com.hrsaas.dto.ResetPasswordRequest;
import com.hrsaas.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register-company")
    public ResponseEntity<AuthResponse> registerCompany(@Valid @RequestBody RegisterCompanyRequest request) {
        AuthResponse response = authService.registerCompany(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/accept-invitation")
    public ResponseEntity<Void> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        authService.acceptInvitation(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}
