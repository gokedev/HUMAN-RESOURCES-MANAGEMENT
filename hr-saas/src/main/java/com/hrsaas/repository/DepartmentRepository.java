package com.hrsaas.repository;

import com.hrsaas.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByCompanyId(UUID companyId);
    Optional<Department> findByIdAndCompanyId(UUID id, UUID companyId);
    boolean existsByCompanyIdAndNameIgnoreCase(UUID companyId, String name);
}
