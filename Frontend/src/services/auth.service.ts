import { apiClient } from './axios';
import type {
  AcceptInvitationRequest,
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RegisterCompanyRequest,
  ResetPasswordRequest,
} from '../types/api';

export const authService = {
  login(payload: LoginRequest) {
    return apiClient.post<AuthResponse>('/api/auth/login', payload).then((response) => response.data);
  },
  registerCompany(payload: RegisterCompanyRequest) {
    return apiClient
      .post<AuthResponse>('/api/auth/register-company', payload)
      .then((response) => response.data);
  },
  refresh(payload: RefreshTokenRequest) {
    return apiClient.post<AuthResponse>('/api/auth/refresh', payload).then((response) => response.data);
  },
  forgotPassword(payload: ForgotPasswordRequest) {
    return apiClient.post<void>('/api/auth/forgot-password', payload).then((response) => response.data);
  },
  resetPassword(payload: ResetPasswordRequest) {
    return apiClient.post<void>('/api/auth/reset-password', payload).then((response) => response.data);
  },
  acceptInvitation(payload: AcceptInvitationRequest) {
    return apiClient.post<void>('/api/auth/accept-invitation', payload).then((response) => response.data);
  },
};
