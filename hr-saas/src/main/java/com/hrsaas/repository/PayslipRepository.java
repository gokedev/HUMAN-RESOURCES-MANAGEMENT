package com.hrsaas.repository;

import com.hrsaas.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayslipRepository extends JpaRepository<Payslip, UUID> {

    List<Payslip> findByCompanyIdAndPayPeriodYearAndPayPeriodMonthOrderByEmployeeId(
            UUID companyId, int year, int month);

    List<Payslip> findByCompanyIdAndEmployeeIdOrderByPayPeriodYearDescPayPeriodMonthDesc(
            UUID companyId, UUID employeeId);

    Optional<Payslip> findByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
            UUID companyId, UUID employeeId, int month, int year);

    boolean existsByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
            UUID companyId, UUID employeeId, int month, int year);
}
