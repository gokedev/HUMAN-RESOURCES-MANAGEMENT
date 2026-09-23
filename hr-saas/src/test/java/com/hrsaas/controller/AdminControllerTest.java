package com.hrsaas.controller;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.dto.CreateEmployeeRequest;
import com.hrsaas.dto.DepartmentCreateDto;
import com.hrsaas.dto.LeaveReviewDto;
import com.hrsaas.dto.PayrollGenerateRequest;
import com.hrsaas.entity.Department;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.entity.User;
import com.hrsaas.enums.LeaveStatus;
import com.hrsaas.security.JwtService;
import com.hrsaas.enums.LeaveType;
import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.service.AttendanceService;
import com.hrsaas.service.DepartmentService;
import com.hrsaas.service.EmployeeService;
import com.hrsaas.service.LeaveService;
import com.hrsaas.service.PayrollService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private EmployeeService employeeService;
    @MockBean private DepartmentService departmentService;
    @MockBean private LeaveService leaveService;
    @MockBean private AttendanceService attendanceService;
    @MockBean private PayrollService payrollService;
    @MockBean private JwtService jwtService ;

    private User sampleUser(UUID id) {
        return User.builder()
                .id(id).companyId(UUID.randomUUID()).email("emp@acme.com")
                .role(Role.EMPLOYEE).status(UserStatus.ACTIVE)
                .firstName("Emp").lastName("Loyee")
                .build();
    }

    // ── employees ────────────────────────────────

    @Test
    void createEmployee_ValidRequest_Returns201() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setEmail("new@acme.com");
        request.setFirstName("New");
        request.setLastName("Hire");

        when(employeeService.createEmployee(any())).thenReturn(sampleUser(UUID.randomUUID()));

        mockMvc.perform(post("/api/admin/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("emp@acme.com"));
    }

    @Test
    void createEmployee_InvalidEmail_Returns400() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setEmail("not-an-email");
        request.setFirstName("New");
        request.setLastName("Hire");

        mockMvc.perform(post("/api/admin/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEmployee_DuplicateEmail_Returns409() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setEmail("dup@acme.com");
        request.setFirstName("New");
        request.setLastName("Hire");

        when(employeeService.createEmployee(any()))
                .thenThrow(ApiException.conflict("An employee with this email already exists in your company"));

        mockMvc.perform(post("/api/admin/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void getEmployee_Found_Returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(employeeService.getEmployee(id)).thenReturn(sampleUser(id));

        mockMvc.perform(get("/api/admin/employees/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void getEmployee_NotFound_Returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(employeeService.getEmployee(id)).thenThrow(ApiException.notFound("Employee not found"));

        mockMvc.perform(get("/api/admin/employees/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void deactivateEmployee_Returns204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(employeeService).deactivateEmployee(id);

        mockMvc.perform(patch("/api/admin/employees/{id}/deactivate", id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteEmployee_Returns204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(employeeService).deleteEmployee(id);

        mockMvc.perform(delete("/api/admin/employees/{id}", id))
                .andExpect(status().isNoContent());
    }

    // ── departments ──────────────────────────────

    @Test
    void createDepartment_ValidRequest_Returns201() throws Exception {
        DepartmentCreateDto dto = new DepartmentCreateDto();
        dto.setName("Engineering");

        Department saved = Department.builder().id(UUID.randomUUID()).name("Engineering").build();
        when(departmentService.createDepartment(any())).thenReturn(saved);

        mockMvc.perform(post("/api/admin/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Engineering"));
    }

    @Test
    void createDepartment_BlankName_Returns400() throws Exception {
        DepartmentCreateDto dto = new DepartmentCreateDto();
        dto.setName("");

        mockMvc.perform(post("/api/admin/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createDepartment_Duplicate_Returns409() throws Exception {
        DepartmentCreateDto dto = new DepartmentCreateDto();
        dto.setName("Engineering");

        when(departmentService.createDepartment(any()))
                .thenThrow(ApiException.conflict("A department with this name already exists"));

        mockMvc.perform(post("/api/admin/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void listDepartments_Returns200WithList() throws Exception {
        when(departmentService.listDepartments()).thenReturn(List.of(
                Department.builder().id(UUID.randomUUID()).name("Engineering").build()
        ));

        mockMvc.perform(get("/api/admin/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Engineering"));
    }

    @Test
    void deleteDepartment_NotFound_Returns404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(ApiException.notFound("Department not found")).when(departmentService).deleteDepartment(id);

        mockMvc.perform(delete("/api/admin/departments/{id}", id))
                .andExpect(status().isNotFound());
    }

    // ── leave review ─────────────────────────────

    @Test
    void reviewLeaveRequest_Approve_Returns200() throws Exception {
        UUID leaveRequestId = UUID.randomUUID();
        LeaveReviewDto dto = new LeaveReviewDto();
        dto.setApprove(true);
        dto.setNote("Approved");

        LeaveRequest approved = LeaveRequest.builder()
                .id(leaveRequestId).companyId(UUID.randomUUID()).employeeId(UUID.randomUUID())
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(1))
                .status(LeaveStatus.APPROVED)
                .build();

        when(leaveService.reviewLeaveRequest(org.mockito.ArgumentMatchers.eq(leaveRequestId), any()))
                .thenReturn(approved);

        mockMvc.perform(patch("/api/admin/leave-requests/{id}/review", leaveRequestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void reviewLeaveRequest_AlreadyReviewed_Returns400() throws Exception {
        UUID leaveRequestId = UUID.randomUUID();
        LeaveReviewDto dto = new LeaveReviewDto();
        dto.setApprove(true);

        when(leaveService.reviewLeaveRequest(org.mockito.ArgumentMatchers.eq(leaveRequestId), any()))
                .thenThrow(ApiException.badRequest("This leave request has already been reviewed"));

        mockMvc.perform(patch("/api/admin/leave-requests/{id}/review", leaveRequestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // ── payroll ──────────────────────────────────

    @Test
    void generatePayroll_ValidRequest_Returns201() throws Exception {
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(6);
        request.setYear(2026);

        when(payrollService.generatePayroll(any())).thenReturn(Map.of("created", 3, "skipped", 0));

        mockMvc.perform(post("/api/admin/payroll/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.created").value(3));
    }

    @Test
    void generatePayroll_InvalidMonth_Returns400() throws Exception {
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(13); // out of range
        request.setYear(2026);

        mockMvc.perform(post("/api/admin/payroll/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generatePayroll_WrongRole_Returns403() throws Exception {
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(6);
        request.setYear(2026);

        when(payrollService.generatePayroll(any()))
                .thenThrow(ApiException.forbidden("You do not have permission to perform this action"));

        mockMvc.perform(post("/api/admin/payroll/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void listPayslips_MissingRequiredParams_Returns400() throws Exception {
        mockMvc.perform(get("/api/admin/payroll/payslips"))
                .andExpect(status().isBadRequest());
    }

       @TestConfiguration
    static class PriorityExceptionHandlingConfig {
        @Bean
        MissingParamAdvice missingParamAdvice() {
            return new MissingParamAdvice();
        }
    }

    @RestControllerAdvice
    @Order(Ordered.HIGHEST_PRECEDENCE)
    static class MissingParamAdvice {
        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<Void> handleMissingParam(MissingServletRequestParameterException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
