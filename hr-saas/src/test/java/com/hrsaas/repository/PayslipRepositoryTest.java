package com.hrsaas.repository;

import com.hrsaas.entity.Company;
import com.hrsaas.entity.Payslip;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class PayslipRepositoryTest {

    @Autowired
    private PayslipRepository payslipRepository;

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

    private Payslip newPayslip(UUID compId, UUID empId, int month, int year) {
        return Payslip.builder()
                .companyId(compId).employeeId(empId)
                .payPeriodMonth(month).payPeriodYear(year)
                .grossSalary(new BigDecimal("5000.00"))
                .unpaidLeaveDays(0)
                .unpaidLeaveDeduction(BigDecimal.ZERO)
                .taxDeduction(new BigDecimal("500.00"))
                .totalDeductions(new BigDecimal("500.00"))
                .netPay(new BigDecimal("4500.00"))
                .generatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void findByCompanyIdAndPayPeriod_ReturnsAllForThatPeriod() {
        payslipRepository.save(newPayslip(companyId, employeeId, 6, 2026));
        payslipRepository.save(newPayslip(companyId, UUID.randomUUID(), 6, 2026));
        payslipRepository.save(newPayslip(companyId, employeeId, 5, 2026));

        List<Payslip> result = payslipRepository
                .findByCompanyIdAndPayPeriodYearAndPayPeriodMonthOrderByEmployeeId(companyId, 2026, 6);

        assertThat(result).hasSize(2);
    }

    @Test
    void findByCompanyIdAndEmployeeId_OrderedDescByYearThenMonth() {
        payslipRepository.save(newPayslip(companyId, employeeId, 1, 2026));
        payslipRepository.save(newPayslip(companyId, employeeId, 6, 2026));
        payslipRepository.save(newPayslip(companyId, employeeId, 12, 2025));

        List<Payslip> result = payslipRepository
                .findByCompanyIdAndEmployeeIdOrderByPayPeriodYearDescPayPeriodMonthDesc(companyId, employeeId);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getPayPeriodYear()).isEqualTo(2026);
        assertThat(result.get(0).getPayPeriodMonth()).isEqualTo(6);
        assertThat(result.get(2).getPayPeriodYear()).isEqualTo(2025);
    }

    @Test
    void findByCompanyIdAndEmployeeIdAndPeriod_ReturnsSinglePayslip() {
        payslipRepository.save(newPayslip(companyId, employeeId, 6, 2026));

        Optional<Payslip> found = payslipRepository
                .findByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(companyId, employeeId, 6, 2026);

        assertThat(found).isPresent();
    }

    @Test
    void existsByCompanyIdAndEmployeeIdAndPeriod_TrueOnlyWhenGenerated() {
        payslipRepository.save(newPayslip(companyId, employeeId, 6, 2026));

        assertThat(payslipRepository.existsByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                companyId, employeeId, 6, 2026)).isTrue();
        assertThat(payslipRepository.existsByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                companyId, employeeId, 7, 2026)).isFalse();
    }

    @Test
    void uniqueConstraint_PreventsDuplicatePayslipForSamePeriod() {
        payslipRepository.saveAndFlush(newPayslip(companyId, employeeId, 6, 2026));

        org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
                payslipRepository.saveAndFlush(newPayslip(companyId, employeeId, 6, 2026)));
    }
}
