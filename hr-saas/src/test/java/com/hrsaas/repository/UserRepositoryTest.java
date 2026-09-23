package com.hrsaas.repository;

import com.hrsaas.entity.Company;
import com.hrsaas.entity.User;
import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    private UUID companyId;
    private UUID otherCompanyId;

    @BeforeEach
    void setUp() {
        Company company = companyRepository.save(Company.builder()
                .name("Acme Inc")
                .slug("acme-inc-" + UUID.randomUUID())
                .isActive(true)
                .build());
        companyId = company.getId();

        Company otherCompany = companyRepository.save(Company.builder()
                .name("Other Inc")
                .slug("other-inc-" + UUID.randomUUID())
                .isActive(true)
                .build());
        otherCompanyId = otherCompany.getId();
    }

    private User newUser(UUID compId, String email, Role role, UserStatus status) {
        return User.builder()
                .companyId(compId)
                .email(email)
                .passwordHash("hash")
                .role(role)
                .status(status)
                .firstName("First")
                .lastName("Last")
                .build();
    }

    @Test
    void findByCompanyIdAndEmailIgnoreCase_MatchesRegardlessOfCase() {
        userRepository.save(newUser(companyId, "Jane@Acme.com", Role.ADMIN, UserStatus.ACTIVE));

        Optional<User> result = userRepository.findByCompanyIdAndEmailIgnoreCase(companyId, "jane@acme.com");

        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("Jane@Acme.com");
    }

    @Test
    void findByCompanyIdAndEmailIgnoreCase_WrongCompany_ReturnsEmpty() {
        userRepository.save(newUser(companyId, "jane@acme.com", Role.ADMIN, UserStatus.ACTIVE));

        Optional<User> result = userRepository.findByCompanyIdAndEmailIgnoreCase(otherCompanyId, "jane@acme.com");

        assertThat(result).isEmpty();
    }

    @Test
    void findByIdAndCompanyId_ScopesToTenant() {
        User saved = userRepository.save(newUser(companyId, "jane@acme.com", Role.EMPLOYEE, UserStatus.ACTIVE));

        assertThat(userRepository.findByIdAndCompanyId(saved.getId(), companyId)).isPresent();
        assertThat(userRepository.findByIdAndCompanyId(saved.getId(), otherCompanyId)).isEmpty();
    }

    @Test
    void existsByCompanyIdAndEmailIgnoreCase_DetectsDuplicates() {
        userRepository.save(newUser(companyId, "jane@acme.com", Role.EMPLOYEE, UserStatus.ACTIVE));

        assertThat(userRepository.existsByCompanyIdAndEmailIgnoreCase(companyId, "JANE@ACME.COM")).isTrue();
        assertThat(userRepository.existsByCompanyIdAndEmailIgnoreCase(companyId, "nope@acme.com")).isFalse();
    }

    @Test
    void findByCompanyId_ReturnsPagedResultsScopedToCompany() {
        userRepository.save(newUser(companyId, "a@acme.com", Role.EMPLOYEE, UserStatus.ACTIVE));
        userRepository.save(newUser(companyId, "b@acme.com", Role.EMPLOYEE, UserStatus.ACTIVE));
        userRepository.save(newUser(otherCompanyId, "c@other.com", Role.EMPLOYEE, UserStatus.ACTIVE));

        Page<User> page = userRepository.findByCompanyId(companyId, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).extracting(User::getEmail)
                .containsExactlyInAnyOrder("a@acme.com", "b@acme.com");
    }

    @Test
    void countByCompanyIdAndStatus_CountsOnlyMatchingStatus() {
        userRepository.save(newUser(companyId, "active1@acme.com", Role.EMPLOYEE, UserStatus.ACTIVE));
        userRepository.save(newUser(companyId, "active2@acme.com", Role.EMPLOYEE, UserStatus.ACTIVE));
        userRepository.save(newUser(companyId, "pending@acme.com", Role.EMPLOYEE, UserStatus.PENDING));

        Long activeCount = userRepository.countByCompanyIdAndStatus(companyId, UserStatus.ACTIVE);
        Long pendingCount = userRepository.countByCompanyIdAndStatus(companyId, UserStatus.PENDING);

        assertThat(activeCount).isEqualTo(2);
        assertThat(pendingCount).isEqualTo(1);
    }

    @Test
    void countEmployeesByHireDateRange_CountsWithinInclusiveRange() {
        User hiredInRange = newUser(companyId, "in@acme.com", Role.EMPLOYEE, UserStatus.ACTIVE);
        hiredInRange.setDateOfHire(LocalDate.of(2026, 3, 15));
        userRepository.save(hiredInRange);

        User hiredOutside = newUser(companyId, "out@acme.com", Role.EMPLOYEE, UserStatus.ACTIVE);
        hiredOutside.setDateOfHire(LocalDate.of(2025, 1, 1));
        userRepository.save(hiredOutside);

        Long count = userRepository.countEmployeesByHireDateRange(
                companyId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));

        assertThat(count).isEqualTo(1);
    }

    @Test
    void countEmployeesByStatusChangeDateRange_UsesUpdatedAt() {
        User user = userRepository.save(newUser(companyId, "recent@acme.com", Role.EMPLOYEE, UserStatus.SUSPENDED));

        Long count = userRepository.countEmployeesByStatusChangeDateRange(
                companyId, UserStatus.SUSPENDED,
                LocalDateTime.now().minusMinutes(5), LocalDateTime.now().plusMinutes(5));

        assertThat(count).isEqualTo(1);
        assertThat(user.getUpdatedAt()).isNotNull();
    }
}
