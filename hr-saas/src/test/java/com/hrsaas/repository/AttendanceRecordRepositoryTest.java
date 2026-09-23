package com.hrsaas.repository;

import com.hrsaas.entity.AttendanceRecord;
import com.hrsaas.entity.Company;
import com.hrsaas.enums.AttendanceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class AttendanceRecordRepositoryTest {

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private CompanyRepository companyRepository;

    private UUID companyId;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        companyId = companyRepository.save(Company.builder()
                .name("Acme").slug("acme-" + UUID.randomUUID()).isActive(true).build()).getId();
        employeeId = UUID.randomUUID();
    }

    private AttendanceRecord newRecord(UUID compId, UUID empId, LocalDate date, AttendanceStatus status) {
        return AttendanceRecord.builder()
                .companyId(compId).employeeId(empId).workDate(date).status(status).build();
    }

    @Test
    void findByEmployeeIdAndWorkDate_ReturnsMatchingRecord() {
        attendanceRecordRepository.save(newRecord(companyId, employeeId, LocalDate.now(), AttendanceStatus.PRESENT));

        Optional<AttendanceRecord> found = attendanceRecordRepository.findByEmployeeIdAndWorkDate(
                employeeId, LocalDate.now());

        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(AttendanceStatus.PRESENT);
    }

    @Test
    void findByEmployeeIdAndWorkDate_NoRecordForDate_ReturnsEmpty() {
        Optional<AttendanceRecord> found = attendanceRecordRepository.findByEmployeeIdAndWorkDate(
                employeeId, LocalDate.now().minusDays(10));

        assertThat(found).isEmpty();
    }

    @Test
    void findByCompanyIdAndEmployeeId_ReturnsPagedResults() {
        attendanceRecordRepository.save(newRecord(companyId, employeeId, LocalDate.now(), AttendanceStatus.PRESENT));
        attendanceRecordRepository.save(newRecord(companyId, employeeId, LocalDate.now().minusDays(1), AttendanceStatus.ABSENT));

        Page<AttendanceRecord> page = attendanceRecordRepository.findByCompanyIdAndEmployeeId(
                companyId, employeeId, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
    }

    @Test
    void findByCompanyId_ScopesToCompany() {
        UUID otherCompanyId = companyRepository.save(Company.builder()
                .name("Other").slug("other-" + UUID.randomUUID()).isActive(true).build()).getId();

        attendanceRecordRepository.save(newRecord(companyId, employeeId, LocalDate.now(), AttendanceStatus.PRESENT));
        attendanceRecordRepository.save(newRecord(otherCompanyId, UUID.randomUUID(), LocalDate.now(), AttendanceStatus.PRESENT));

        Page<AttendanceRecord> page = attendanceRecordRepository.findByCompanyId(companyId, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
    }

    @Test
    void countByCompanyIdAndWorkDate_GroupsByLowercaseStatus() {
        attendanceRecordRepository.save(newRecord(companyId, UUID.randomUUID(), LocalDate.now(), AttendanceStatus.PRESENT));
        attendanceRecordRepository.save(newRecord(companyId, UUID.randomUUID(), LocalDate.now(), AttendanceStatus.PRESENT));
        attendanceRecordRepository.save(newRecord(companyId, UUID.randomUUID(), LocalDate.now(), AttendanceStatus.ABSENT));

        List<Object[]> result = attendanceRecordRepository.countByCompanyIdAndWorkDate(companyId, LocalDate.now());

        assertThat(result).hasSize(2);
        for (Object[] row : result) {
            String status = (String) row[0];
            Long count = (Long) row[1];
            if (status.equals("present")) {
                assertThat(count).isEqualTo(2L);
            } else if (status.equals("absent")) {
                assertThat(count).isEqualTo(1L);
            }
        }
    }
}
