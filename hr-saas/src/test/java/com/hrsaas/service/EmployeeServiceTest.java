package com.hrsaas.service;

import com.hrsaas.dto.CreateEmployeeRequest;
import com.hrsaas.dto.EmployeeCounts;
import com.hrsaas.dto.HeadcountTrendData;
import com.hrsaas.entity.Company;
import com.hrsaas.entity.Invitation;
import com.hrsaas.entity.User;
import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.CompanyRepository;
import com.hrsaas.repository.InvitationRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private InvitationRepository invitationRepository;

    @Mock
    private MailService mailService;

    @InjectMocks
    private EmployeeService employeeService;

    private UUID tenantId;
    private UUID employeeId;
    private Company company;
    private User employee;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(employeeService, "inviteExpirationHours", 72L);
        ReflectionTestUtils.setField(employeeService, "frontendBaseUrl", "https://app.example.com");

        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        company = Company.builder()
                .id(tenantId)
                .name("Test Company")
                .slug("test-company")
                .isActive(true)
                .build();

        employee = User.builder()
                .id(employeeId)
                .companyId(tenantId)
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .role(Role.EMPLOYEE)
                .status(UserStatus.ACTIVE)
                .build();

        TenantContext.setTenantId(tenantId);
        TenantContext.setUserId(employeeId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ── getEmployee ─────────────────────────────

    @Test
    void getEmployee_Success() {
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId))
                .thenReturn(Optional.of(employee));

        User result = employeeService.getEmployee(employeeId);

        assertNotNull(result);
        assertEquals(employeeId, result.getId());
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void getEmployee_NotFound() {
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId))
                .thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> employeeService.getEmployee(employeeId));
    }

    // ── createEmployee ──────────────────────────

    @Test
    void createEmployee_Success() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setEmail("new@example.com");
        request.setFirstName("Jane");
        request.setLastName("Smith");

        when(userRepository.existsByCompanyIdAndEmailIgnoreCase(tenantId, "new@example.com"))
                .thenReturn(false);
        when(companyRepository.findById(tenantId))
                .thenReturn(Optional.of(company));
        when(userRepository.save(any(User.class)))
                .thenReturn(employee);

        User result = employeeService.createEmployee(request);

        assertNotNull(result);
        verify(userRepository).save(any(User.class));
        verify(invitationRepository).save(any());
        verify(mailService).sendEmployeeInvitation(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void createEmployee_DuplicateEmail() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setEmail("existing@example.com");

        when(userRepository.existsByCompanyIdAndEmailIgnoreCase(tenantId, "existing@example.com"))
                .thenReturn(true);

        assertThrows(ApiException.class, () -> employeeService.createEmployee(request));
    }

    @Test
    void createEmployee_CompanyNotFound_ThrowsNotFound() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setEmail("new@example.com");
        request.setFirstName("Jane");
        request.setLastName("Smith");

        when(userRepository.existsByCompanyIdAndEmailIgnoreCase(tenantId, "new@example.com"))
                .thenReturn(false);
        when(companyRepository.findById(tenantId)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> employeeService.createEmployee(request));
        verify(mailService, never()).sendEmployeeInvitation(anyString(), anyString(), anyString(), anyString());
    }

    // ── updateEmployee ──────────────────────────

    @Test
    void updateEmployee_Success() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setFirstName("UpdatedFirst");
        request.setLastName("UpdatedLast");
        request.setPhone("555-1234");
        request.setJobTitle("Engineer");

        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = employeeService.updateEmployee(employeeId, request);

        assertEquals("UpdatedFirst", result.getFirstName());
        assertEquals("UpdatedLast", result.getLastName());
        assertEquals("555-1234", result.getPhone());
        assertEquals("Engineer", result.getJobTitle());
    }

    @Test
    void updateEmployee_NotFound_ThrowsNotFound() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> employeeService.updateEmployee(employeeId, request));
    }

    // ── deactivate / reactivate ─────────────────

    @Test
    void deactivateEmployee_SetsSuspended() {
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        employeeService.deactivateEmployee(employeeId);

        assertEquals(UserStatus.SUSPENDED, employee.getStatus());
    }

    @Test
    void reactivateEmployee_SetsActive() {
        employee.setStatus(UserStatus.SUSPENDED);
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        employeeService.reactivateEmployee(employeeId);

        assertEquals(UserStatus.ACTIVE, employee.getStatus());
    }

    // ── deleteEmployee ───────────────────────────

    @Test
    void deleteEmployee_WithPendingInvitation_DeletesBoth() {
        Invitation invitation = Invitation.builder().id(UUID.randomUUID()).userId(employeeId).build();

        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(invitationRepository.findByUserIdAndAcceptedAtIsNull(employeeId)).thenReturn(Optional.of(invitation));

        employeeService.deleteEmployee(employeeId);

        verify(invitationRepository).delete(invitation);
        verify(userRepository).delete(employee);
    }

    @Test
    void deleteEmployee_NoInvitation_DeletesUserOnly() {
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(invitationRepository.findByUserIdAndAcceptedAtIsNull(employeeId)).thenReturn(Optional.empty());

        employeeService.deleteEmployee(employeeId);

        verify(invitationRepository, never()).delete(any());
        verify(userRepository).delete(employee);
    }

    // ── resendInvitation ─────────────────────────

    @Test
    void resendInvitation_PendingEmployee_Success() {
        employee.setStatus(UserStatus.PENDING);
        Invitation invitation = Invitation.builder().id(UUID.randomUUID()).userId(employeeId).build();

        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(invitationRepository.findByUserIdAndAcceptedAtIsNull(employeeId)).thenReturn(Optional.of(invitation));
        when(companyRepository.findById(tenantId)).thenReturn(Optional.of(company));

        employeeService.resendInvitation(employeeId);

        verify(invitationRepository).save(invitation);
        verify(mailService).sendEmployeeInvitation(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void resendInvitation_NonPendingEmployee_ThrowsBadRequest() {
        employee.setStatus(UserStatus.ACTIVE);
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));

        assertThrows(ApiException.class, () -> employeeService.resendInvitation(employeeId));
    }

    @Test
    void resendInvitation_NoPendingInvitation_ThrowsNotFound() {
        employee.setStatus(UserStatus.PENDING);
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(invitationRepository.findByUserIdAndAcceptedAtIsNull(employeeId)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> employeeService.resendInvitation(employeeId));
    }

    // ── revokeInvitation ─────────────────────────

    @Test
    void revokeInvitation_DeletesIfPresent() {
        Invitation invitation = Invitation.builder().id(UUID.randomUUID()).userId(employeeId).build();
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(invitationRepository.findByUserIdAndAcceptedAtIsNull(employeeId)).thenReturn(Optional.of(invitation));

        employeeService.revokeInvitation(employeeId);

        verify(invitationRepository).delete(invitation);
    }

    @Test
    void revokeInvitation_NoInvitation_NoOp() {
        when(userRepository.findByIdAndCompanyId(employeeId, tenantId)).thenReturn(Optional.of(employee));
        when(invitationRepository.findByUserIdAndAcceptedAtIsNull(employeeId)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> employeeService.revokeInvitation(employeeId));
        verify(invitationRepository, never()).delete(any());
    }

    // ── analytics ─────────────────────────────────

    @Test
    void getActiveVsPendingCounts_ReturnsAllThreeCounts() {
        when(userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.ACTIVE)).thenReturn(10L);
        when(userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.PENDING)).thenReturn(3L);
        when(userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.SUSPENDED)).thenReturn(1L);

        EmployeeCounts result = employeeService.getActiveVsPendingCounts();

        assertEquals(10, result.getActive());
        assertEquals(3, result.getPending());
        assertEquals(1, result.getSuspended());
    }

    @Test
    void getHeadcountTrend_ReturnsHiresAndSeparations() {
        when(userRepository.countEmployeesByHireDateRange(eq(tenantId), any(), any())).thenReturn(5L);
        when(userRepository.countEmployeesByStatusChangeDateRange(eq(tenantId), eq(UserStatus.SUSPENDED), any(), any()))
                .thenReturn(2L);

        HeadcountTrendData result = employeeService.getHeadcountTrend(6);

        assertNotNull(result);
        assertEquals(1, result.getHires().size());
        assertEquals(5, result.getHires().get(0).getValue());
        assertEquals(2, result.getSeparations().get(0).getValue());
    }

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
