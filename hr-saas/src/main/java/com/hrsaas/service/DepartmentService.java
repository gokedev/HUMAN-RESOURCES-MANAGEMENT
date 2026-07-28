package com.hrsaas.service;

import com.hrsaas.dto.DepartmentCreateDto;
import com.hrsaas.entity.Department;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.DepartmentRepository;
import com.hrsaas.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Transactional
    public Department createDepartment(DepartmentCreateDto dto) {
        UUID tenantId = TenantContext.getTenantId();

        if (departmentRepository.existsByCompanyIdAndNameIgnoreCase(tenantId, dto.getName())) {
            throw ApiException.conflict("A department with this name already exists");
        }

        Department department = Department.builder()
                .companyId(tenantId)
                .name(dto.getName())
                .build();
        return departmentRepository.save(department);
    }

    public List<Department> listDepartments() {
        return departmentRepository.findByCompanyId(TenantContext.getTenantId());
    }

    @Transactional
    public void deleteDepartment(UUID departmentId) {
        Department department = departmentRepository.findByIdAndCompanyId(departmentId, TenantContext.getTenantId())
                .orElseThrow(() -> ApiException.notFound("Department not found"));
        departmentRepository.delete(department);
    }
}
