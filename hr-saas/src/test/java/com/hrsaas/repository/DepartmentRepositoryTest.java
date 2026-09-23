package com.hrsaas.repository;

import com.hrsaas.entity.Company;
import com.hrsaas.entity.Department;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class DepartmentRepositoryTest {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CompanyRepository companyRepository;

    private UUID companyId;
    private UUID otherCompanyId;

    @BeforeEach
    void setUp() {
        companyId = companyRepository.save(Company.builder()
                .name("Acme").slug("acme-" + UUID.randomUUID()).isActive(true).build()).getId();
        otherCompanyId = companyRepository.save(Company.builder()
                .name("Other").slug("other-" + UUID.randomUUID()).isActive(true).build()).getId();
    }

    @Test
    void findByCompanyId_ReturnsOnlyThatCompanysDepartments() {
        departmentRepository.save(Department.builder().companyId(companyId).name("Engineering").build());
        departmentRepository.save(Department.builder().companyId(companyId).name("Sales").build());
        departmentRepository.save(Department.builder().companyId(otherCompanyId).name("HR").build());

        List<Department> result = departmentRepository.findByCompanyId(companyId);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Department::getName).containsExactlyInAnyOrder("Engineering", "Sales");
    }

    @Test
    void findByIdAndCompanyId_ScopesToTenant() {
        Department dept = departmentRepository.save(
                Department.builder().companyId(companyId).name("Engineering").build());

        Optional<Department> found = departmentRepository.findByIdAndCompanyId(dept.getId(), companyId);
        Optional<Department> notFound = departmentRepository.findByIdAndCompanyId(dept.getId(), otherCompanyId);

        assertThat(found).isPresent();
        assertThat(notFound).isEmpty();
    }

    @Test
    void existsByCompanyIdAndNameIgnoreCase_IsCaseInsensitive() {
        departmentRepository.save(Department.builder().companyId(companyId).name("Engineering").build());

        assertThat(departmentRepository.existsByCompanyIdAndNameIgnoreCase(companyId, "engineering")).isTrue();
        assertThat(departmentRepository.existsByCompanyIdAndNameIgnoreCase(companyId, "ENGINEERING")).isTrue();
        assertThat(departmentRepository.existsByCompanyIdAndNameIgnoreCase(companyId, "Marketing")).isFalse();
    }

    @Test
    void existsByCompanyIdAndNameIgnoreCase_DifferentCompanySameName_ReturnsFalse() {
        departmentRepository.save(Department.builder().companyId(companyId).name("Engineering").build());

        assertThat(departmentRepository.existsByCompanyIdAndNameIgnoreCase(otherCompanyId, "Engineering")).isFalse();
    }
}
