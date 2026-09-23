package com.hrsaas.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.dto.LeaveRequestCreateDto;
import com.hrsaas.dto.PayslipResponseDto;
import com.hrsaas.dto.UpdatePasswordRequest;
import com.hrsaas.entity.AttendanceRecord;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.entity.User;
import com.hrsaas.enums.AttendanceStatus;
import com.hrsaas.enums.LeaveStatus;
import com.hrsaas.enums.LeaveType;
import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.service.AttendanceService;
import com.hrsaas.service.AuthService;
import com.hrsaas.service.EmployeeService;
import com.hrsaas.service.LeaveService;
import com.hrsaas.service.PayrollService;
import com.hrsaas.security.JwtService;
import com.hrsaas.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EmployeeController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private EmployeeService employeeService;
    @MockBean private LeaveService leaveService;
    @MockBean private AttendanceService attendanceService;
    @MockBean private PayrollService payrollService;
    @MockBean private AuthService authService;
    @MockBean private JwtService jwtService ;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        // WebMvcTest with addFilters=false skips the real JwtAuthenticationFilter,
        // so TenantContext is seeded directly to simulate an authenticated request.
        TenantContext.setTenantId(UUID.randomUUID());
        TenantContext.setUserId(userId);
        TenantContext.setRole(Role.EMPLOYEE.name());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private User sampleUser() {
        return User.builder()
                .id(userId).companyId(UUID.randomUUID()).email("me@acme.com")
                .role(Role.EMPLOYEE).status(UserStatus.ACTIVE)
                .firstName("Me").lastName("Myself")
                .build();
    }

    // ── profile ──────────────────────────────────

    @Test
    void getProfile_Returns200WithOwnData() throws Exception {
        when(employeeService.getEmployee(userId)).thenReturn(sampleUser());

        mockMvc.perform(get("/api/employee/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me@acme.com"));
    }

    // ── leave requests ───────────────────────────

    @Test
    void createLeaveRequest_ValidRequest_Returns201() throws Exception {
        LeaveRequestCreateDto dto = new LeaveRequestCreateDto();
        dto.setLeaveType(LeaveType.ANNUAL);
        dto.setStartDate(LocalDate.now().plusDays(1));
        dto.setEndDate(LocalDate.now().plusDays(3));
        dto.setReason("Trip");

        LeaveRequest saved = LeaveRequest.builder()
                .id(UUID.randomUUID()).companyId(UUID.randomUUID()).employeeId(userId)
                .leaveType(LeaveType.ANNUAL)
                .startDate(dto.getStartDate()).endDate(dto.getEndDate())
                .reason("Trip").status(LeaveStatus.PENDING)
                .build();

        when(leaveService.createLeaveRequest(any())).thenReturn(saved);

        mockMvc.perform(post("/api/employee/leave-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void createLeaveRequest_PastStartDate_Returns400() throws Exception {
        LeaveRequestCreateDto dto = new LeaveRequestCreateDto();
        dto.setLeaveType(LeaveType.ANNUAL);
        dto.setStartDate(LocalDate.now().minusDays(1)); // fails @FutureOrPresent
        dto.setEndDate(LocalDate.now().plusDays(1));

        mockMvc.perform(post("/api/employee/leave-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createLeaveRequest_EndBeforeStart_Returns400() throws Exception {
        LeaveRequestCreateDto dto = new LeaveRequestCreateDto();
        dto.setLeaveType(LeaveType.ANNUAL);
        dto.setStartDate(LocalDate.now().plusDays(5));
        dto.setEndDate(LocalDate.now().plusDays(1));

        when(leaveService.createLeaveRequest(any()))
                .thenThrow(ApiException.badRequest("End date cannot be before start date"));

        mockMvc.perform(post("/api/employee/leave-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listOwnLeaveRequests_Returns200() throws Exception {
        LeaveRequest lr = LeaveRequest.builder()
                .id(UUID.randomUUID()).companyId(UUID.randomUUID()).employeeId(userId)
                .leaveType(LeaveType.SICK).startDate(LocalDate.now()).endDate(LocalDate.now())
                .status(LeaveStatus.PENDING).build();
        Page<LeaveRequest> page = new PageImpl<>(List.of(lr));

        when(leaveService.listOwnLeaveRequests(any())).thenReturn(page);

        mockMvc.perform(get("/api/employee/leave-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].leaveType").value("SICK"));
    }

    @Test
    void cancelLeaveRequest_Success_Returns204() throws Exception {
        UUID leaveRequestId = UUID.randomUUID();
        doNothing().when(leaveService).cancelLeaveRequest(leaveRequestId);

        mockMvc.perform(patch("/api/employee/leave-requests/{id}/cancel", leaveRequestId))
                .andExpect(status().isNoContent());
    }

    @Test
    void cancelLeaveRequest_NotOwner_Returns403() throws Exception {
        UUID leaveRequestId = UUID.randomUUID();
        doThrow(ApiException.forbidden("You can only cancel your own leave requests"))
                .when(leaveService).cancelLeaveRequest(leaveRequestId);

        mockMvc.perform(patch("/api/employee/leave-requests/{id}/cancel", leaveRequestId))
                .andExpect(status().isForbidden());
    }

    // ── attendance ───────────────────────────────

    @Test
    void checkIn_Success_Returns201() throws Exception {
        AttendanceRecord record = AttendanceRecord.builder()
                .id(UUID.randomUUID()).companyId(UUID.randomUUID()).employeeId(userId)
                .workDate(LocalDate.now()).checkIn(LocalDateTime.now())
                .status(AttendanceStatus.PRESENT).build();

        when(attendanceService.checkIn()).thenReturn(record);

        mockMvc.perform(post("/api/employee/attendance/check-in"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PRESENT"));
    }

    @Test
    void checkIn_AlreadyCheckedIn_Returns409() throws Exception {
        when(attendanceService.checkIn())
                .thenThrow(ApiException.conflict("You have already checked in today"));

        mockMvc.perform(post("/api/employee/attendance/check-in"))
                .andExpect(status().isConflict());
    }

    @Test
    void checkOut_Success_Returns200() throws Exception {
        AttendanceRecord record = AttendanceRecord.builder()
                .id(UUID.randomUUID()).companyId(UUID.randomUUID()).employeeId(userId)
                .workDate(LocalDate.now()).checkIn(LocalDateTime.now().minusHours(8))
                .checkOut(LocalDateTime.now()).status(AttendanceStatus.PRESENT).build();

        when(attendanceService.checkOut()).thenReturn(record);

        mockMvc.perform(post("/api/employee/attendance/check-out"))
                .andExpect(status().isOk());
    }

    @Test
    void checkOut_NoCheckInToday_Returns400() throws Exception {
        when(attendanceService.checkOut())
                .thenThrow(ApiException.badRequest("You have not checked in today"));

        mockMvc.perform(post("/api/employee/attendance/check-out"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listOwnAttendance_Returns200() throws Exception {
        Page<AttendanceRecord> page = new PageImpl<>(List.of());
        when(attendanceService.listOwnAttendance(any())).thenReturn(page);

        mockMvc.perform(get("/api/employee/attendance"))
                .andExpect(status().isOk());
    }

    // ── leave balance ─────────────────────────────

    @Test
    void getOwnLeaveBalance_Returns200() throws Exception {
        when(leaveService.getAllLeaveBalances(userId)).thenReturn(List.of());

        mockMvc.perform(get("/api/employee/leave-balance"))
                .andExpect(status().isOk());
    }

    // ── payroll ───────────────────────────────────

    @Test
    void listMyPayslips_Returns200() throws Exception {
        PayslipResponseDto dto = new PayslipResponseDto(
                UUID.randomUUID(), userId, "Me Myself", "me@acme.com",
                6, 2026, new BigDecimal("5000"), 0, BigDecimal.ZERO,
                new BigDecimal("500"), new BigDecimal("500"), new BigDecimal("4500"),
                LocalDateTime.now());

        when(payrollService.listMyPayslips()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/employee/payroll/payslips"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employeeName").value("Me Myself"));
    }

    @Test
    void getMyPayslip_NotFound_Returns404() throws Exception {
        UUID payslipId = UUID.randomUUID();
        when(payrollService.getPayslip(payslipId)).thenThrow(ApiException.notFound("Payslip not found"));

        mockMvc.perform(get("/api/employee/payroll/payslips/{id}", payslipId))
                .andExpect(status().isNotFound());
    }

    // ── password update ───────────────────────────

    @Test
    void updatePassword_ValidRequest_Returns204() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest();
        request.setCurrentPassword("OldPass1!");
        request.setNewPassword("NewPass1!");

        doNothing().when(authService).updatePassword(userId, "OldPass1!", "NewPass1!");

        mockMvc.perform(patch("/api/employee/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }

    @Test
    void updatePassword_WeakPassword_Returns400() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest();
        request.setCurrentPassword("OldPass1!");
        request.setNewPassword("weak"); // fails pattern

        mockMvc.perform(patch("/api/employee/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updatePassword_WrongCurrentPassword_Returns400() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest();
        request.setCurrentPassword("WrongOld1!");
        request.setNewPassword("NewPass1!");

        doThrow(ApiException.badRequest("Current password is incorrect"))
                .when(authService).updatePassword(userId, "WrongOld1!", "NewPass1!");

        mockMvc.perform(patch("/api/employee/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
