package com.hrsaas.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.dto.AcceptInvitationRequest;
import com.hrsaas.dto.AuthResponse;
import com.hrsaas.dto.ForgotPasswordRequest;
import com.hrsaas.dto.LoginRequest;
import com.hrsaas.dto.RefreshTokenRequest;
import com.hrsaas.dto.RegisterCompanyRequest;
import com.hrsaas.dto.ResetPasswordRequest;
import com.hrsaas.exception.ApiException;
import com.hrsaas.service.AuthService;
import com.hrsaas.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;
    @MockBean
    private JwtService jwtService ;

    private AuthResponse sampleAuthResponse() {
        return AuthResponse.builder()
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .role("ADMIN")
                .email("jane@acme.com")
                .companySlug("acme-inc")
                .build();
    }

    @Test
    void registerCompany_ValidRequest_Returns201() throws Exception {
        RegisterCompanyRequest request = new RegisterCompanyRequest();
        request.setCompanyName("Acme Inc");
        request.setAdminEmail("jane@acme.com");
        request.setAdminPassword("Password1!");
        request.setAdminFirstName("Jane");
        request.setAdminLastName("Doe");

        when(authService.registerCompany(any())).thenReturn(sampleAuthResponse());

        mockMvc.perform(post("/api/auth/register-company")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.companySlug").value("acme-inc"));
    }

    @Test
    void registerCompany_InvalidPassword_Returns400() throws Exception {
        RegisterCompanyRequest request = new RegisterCompanyRequest();
        request.setCompanyName("Acme Inc");
        request.setAdminEmail("jane@acme.com");
        request.setAdminPassword("weak"); // fails pattern + size
        request.setAdminFirstName("Jane");
        request.setAdminLastName("Doe");

        mockMvc.perform(post("/api/auth/register-company")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerCompany_MissingCompanyName_Returns400() throws Exception {
        RegisterCompanyRequest request = new RegisterCompanyRequest();
        request.setAdminEmail("jane@acme.com");
        request.setAdminPassword("Password1!");
        request.setAdminFirstName("Jane");
        request.setAdminLastName("Doe");

        mockMvc.perform(post("/api/auth/register-company")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_ValidCredentials_Returns200() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@acme.com");
        request.setPassword("Password1!");
        request.setCompanySlug("acme-inc");

        when(authService.login(any())).thenReturn(sampleAuthResponse());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"));
    }

    @Test
    void login_InvalidCredentials_Returns401() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@acme.com");
        request.setPassword("WrongPass1!");
        request.setCompanySlug("acme-inc");

        when(authService.login(any())).thenThrow(ApiException.unauthorized("Invalid company, email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_MissingFields_Returns400() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("not-an-email");
        request.setPassword("short");
        request.setCompanySlug("acme-inc");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void acceptInvitation_Valid_Returns200() throws Exception {
        AcceptInvitationRequest request = new AcceptInvitationRequest();
        request.setToken("tok-123");
        request.setPassword("Password1!");

        mockMvc.perform(post("/api/auth/accept-invitation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void acceptInvitation_ExpiredToken_Returns400() throws Exception {
        AcceptInvitationRequest request = new AcceptInvitationRequest();
        request.setToken("expired-token");
        request.setPassword("Password1!");

        org.mockito.Mockito.doThrow(ApiException.badRequest("This invitation has expired"))
                .when(authService).acceptInvitation(any());

        mockMvc.perform(post("/api/auth/accept-invitation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refresh_ValidToken_Returns200() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid-refresh-token");

        when(authService.refreshToken(any())).thenReturn(sampleAuthResponse());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"));
    }

    @Test
    void refresh_MissingToken_Returns400() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void forgotPassword_AlwaysReturns200() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("ghost@acme.com");
        request.setCompanySlug("acme-inc");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void resetPassword_ValidToken_Returns200() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("reset-token");
        request.setNewPassword("NewPassword1!");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void resetPassword_ExpiredToken_Returns400() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("expired-token");
        request.setNewPassword("NewPassword1!");

        org.mockito.Mockito.doThrow(ApiException.badRequest("This reset link has expired"))
                .when(authService).resetPassword(any());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
