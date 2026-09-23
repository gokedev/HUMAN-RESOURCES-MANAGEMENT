package com.hrsaas.service;

import com.hrsaas.dto.DepartmentCreateDto;
import com.hrsaas.entity.Department;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.DepartmentRepository;
import com.hrsaas.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DepartmentService departmentService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createDepartment_Success() {
        DepartmentCreateDto dto = new DepartmentCreateDto();
        dto.setName("Engineering");

        when(departmentRepository.existsByCompanyIdAndNameIgnoreCase(tenantId, "Engineering"))
                .thenReturn(false);
        when(departmentRepository.save(any(Department.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Department result = departmentService.createDepartment(dto);

        assertNotNull(result);
        assertEquals("Engineering", result.getName());
        assertEquals(tenantId, result.getCompanyId());
    }

    @Test
    void createDepartment_DuplicateName_ThrowsConflict() {
        DepartmentCreateDto dto = new DepartmentCreateDto();
        dto.setName("Engineering");

        when(departmentRepository.existsByCompanyIdAndNameIgnoreCase(tenantId, "Engineering"))
                .thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> departmentService.createDepartment(dto));
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
        verify(departmentRepository, never()).save(any());
    }

    @Test
    void listDepartments_ReturnsForCurrentTenant() {
        List<Department> departments = List.of(
                Department.builder().id(UUID.randomUUID()).companyId(tenantId).name("Engineering").build(),
                Department.builder().id(UUID.randomUUID()).companyId(tenantId).name("Sales").build()
        );
        when(departmentRepository.findByCompanyId(tenantId)).thenReturn(departments);

        List<Department> result = departmentService.listDepartments();

        assertEquals(2, result.size());
    }

    @Test
    void deleteDepartment_Success() {
        UUID deptId = UUID.randomUUID();
        Department department = Department.builder().id(deptId).companyId(tenantId).name("Engineering").build();

        when(departmentRepository.findByIdAndCompanyId(deptId, tenantId)).thenReturn(Optional.of(department));

        departmentService.deleteDepartment(deptId);

        verify(departmentRepository).delete(department);
    }

    @Test
    void deleteDepartment_NotFound_ThrowsNotFound() {
        UUID deptId = UUID.randomUUID();
        when(departmentRepository.findByIdAndCompanyId(deptId, tenantId)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> departmentService.deleteDepartment(deptId));
        verify(departmentRepository, never()).delete(any());
    }
}
