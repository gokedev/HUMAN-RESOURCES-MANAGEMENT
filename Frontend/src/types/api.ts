export type UserRole = 'ADMIN' | 'EMPLOYEE';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'MATERNITY' | 'PATERNITY' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';

export interface ApiErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}

export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: PageMetadata;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  email: string;
  companySlug: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  companySlug: string;
}

export interface RegisterCompanyRequest {
  companyName: string;
  industry?: string;
  country?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
  companySlug: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

export interface User {
  id: string;
  companyId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  phone?: string;
  jobTitle?: string;
  departmentId?: string;
  managerId?: string;
  dateOfHire?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRequest {
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  jobTitle?: string;
  departmentId?: string;
  managerId?: string;
  dateOfHire?: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  createdAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ReviewLeaveRequest {
  approve: boolean;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  workDate: string;
  checkIn: string;
  checkOut: string | null;
  status: AttendanceStatus;
  createdAt: string;
}
