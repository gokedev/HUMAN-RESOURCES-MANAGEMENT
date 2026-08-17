package com.hrsaas.service;

import com.hrsaas.dto.DepartmentCreateDto;
import com.hrsaas.entity.Department;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.DepartmentRepository;
import com.hrsaas.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DepartmentService {

    private static final Logger log = LoggerFactory.getLogger(DepartmentService.class);

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Transactional
    @CacheEvict(value = "departments", key = "#result.companyId")
    public Department createDepartment(DepartmentCreateDto dto) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Creating department '{}' for company={}", dto.getName(), tenantId);

        if (departmentRepository.existsByCompanyIdAndNameIgnoreCase(tenantId, dto.getName())) {
            throw ApiException.conflict("A department with this name already exists");
        }

        Department department = Department.builder()
                .companyId(tenantId)
                .name(dto.getName())
                .build();
        Department saved = departmentRepository.save(department);
        log.info("Department created: id={}, name={}", saved.getId(), saved.getName());
        return saved;
    }

    @Cacheable(value = "departments", key = "T(com.hrsaas.tenant.TenantContext).getTenantId()")
    public List<Department> listDepartments() {
        UUID tenantId = TenantContext.getTenantId();
        log.debug("Listing departments for company={}", tenantId);
        return departmentRepository.findByCompanyId(tenantId);
    }

    @Transactional
    @CacheEvict(value = "departments", key = "T(com.hrsaas.tenant.TenantContext).getTenantId()")
    public void deleteDepartment(UUID departmentId) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Deleting department={} from company={}", departmentId, tenantId);
        Department department = departmentRepository.findByIdAndCompanyId(departmentId, tenantId)
                .orElseThrow(() -> ApiException.notFound("Department not found"));
        departmentRepository.delete(department);
        log.info("Department deleted: id={}", departmentId);
    }
}
