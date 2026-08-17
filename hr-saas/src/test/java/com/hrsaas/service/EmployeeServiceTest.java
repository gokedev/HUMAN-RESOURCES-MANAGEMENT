package com.hrsaas.service;

import com.hrsaas.dto.CreateEmployeeRequest;
import com.hrsaas.entity.Company;
import com.hrsaas.entity.User;
import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.CompanyRepository;
import com.hrsaas.repository.InvitationRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
}
