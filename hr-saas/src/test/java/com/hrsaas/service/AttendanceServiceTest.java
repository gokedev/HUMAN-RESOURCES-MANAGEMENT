package com.hrsaas.service;

import com.hrsaas.dto.AttendanceComplianceData;
import com.hrsaas.dto.EmployeeCounts;
import com.hrsaas.entity.AttendanceRecord;
import com.hrsaas.enums.AttendanceStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.AttendanceRecordRepository;
import com.hrsaas.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private EmployeeService employeeService;

    @InjectMocks
    private AttendanceService attendanceService;

    private UUID tenantId;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        TenantContext.setUserId(employeeId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void checkIn_Success() {
        when(attendanceRecordRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.now()))
                .thenReturn(Optional.empty());
        when(attendanceRecordRepository.save(any(AttendanceRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AttendanceRecord result = attendanceService.checkIn();

        assertNotNull(result);
        assertEquals(AttendanceStatus.PRESENT, result.getStatus());
        assertNotNull(result.getCheckIn());
        assertEquals(employeeId, result.getEmployeeId());
    }

    @Test
    void checkIn_AlreadyCheckedInToday_ThrowsConflict() {
        AttendanceRecord existing = AttendanceRecord.builder()
                .id(UUID.randomUUID()).companyId(tenantId).employeeId(employeeId)
                .workDate(LocalDate.now()).status(AttendanceStatus.PRESENT).build();

        when(attendanceRecordRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.now()))
                .thenReturn(Optional.of(existing));

        ApiException ex = assertThrows(ApiException.class, () -> attendanceService.checkIn());
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
        verify(attendanceRecordRepository, never()).save(any());
    }

    @Test
    void checkOut_Success() {
        AttendanceRecord existing = AttendanceRecord.builder()
                .id(UUID.randomUUID()).companyId(tenantId).employeeId(employeeId)
                .workDate(LocalDate.now()).status(AttendanceStatus.PRESENT).build();

        when(attendanceRecordRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.now()))
                .thenReturn(Optional.of(existing));
        when(attendanceRecordRepository.save(any(AttendanceRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AttendanceRecord result = attendanceService.checkOut();

        assertNotNull(result.getCheckOut());
    }

    @Test
    void checkOut_NoCheckInToday_ThrowsBadRequest() {
        when(attendanceRecordRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.now()))
                .thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> attendanceService.checkOut());
    }

    @Test
    void checkOut_AlreadyCheckedOut_ThrowsConflict() {
        AttendanceRecord existing = AttendanceRecord.builder()
                .id(UUID.randomUUID()).companyId(tenantId).employeeId(employeeId)
                .workDate(LocalDate.now()).status(AttendanceStatus.PRESENT)
                .checkOut(java.time.LocalDateTime.now().minusHours(1))
                .build();

        when(attendanceRecordRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.now()))
                .thenReturn(Optional.of(existing));

        ApiException ex = assertThrows(ApiException.class, () -> attendanceService.checkOut());
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
        verify(attendanceRecordRepository, never()).save(any());
    }

    @Test
    void listOwnAttendance_DelegatesToRepositoryWithTenantAndEmployee() {
        Pageable pageable = PageRequest.of(0, 10);
        attendanceService.listOwnAttendance(pageable);

        verify(attendanceRecordRepository).findByCompanyIdAndEmployeeId(tenantId, employeeId, pageable);
    }

    @Test
    void listCompanyAttendance_DelegatesToRepositoryWithTenant() {
        Pageable pageable = PageRequest.of(0, 10);
        attendanceService.listCompanyAttendance(pageable);

        verify(attendanceRecordRepository).findByCompanyId(tenantId, pageable);
    }

    @Test
    void getAttendanceCompliance_ComputesRateFromStatusCounts() {
        List<Object[]> todayRows = Collections.singletonList(new Object[]{"present", 8L});
        List<Object[]> weekRows = Collections.singletonList(new Object[]{"present", 40L});
        when(attendanceRecordRepository.countByCompanyIdAndWorkDate(eq(tenantId), any(LocalDate.class)))
                .thenReturn(todayRows);
        when(attendanceRecordRepository.countByCompanyIdAndWorkDateBetween(eq(tenantId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(weekRows);
        when(employeeService.getActiveVsPendingCounts())
                .thenReturn(new EmployeeCounts(10, 2, 0));

        AttendanceComplianceData result = attendanceService.getAttendanceCompliance();

        assertEquals(10, result.getExpectedCheckins());
        assertEquals(8, result.getActualCheckins());
        assertEquals(8, result.getTodayCheckedIn());
        assertEquals(80.0, result.getComplianceRate(), 0.001);
    }

    @Test
    void getAttendanceCompliance_NoEmployees_ZeroComplianceRate() {
        when(attendanceRecordRepository.countByCompanyIdAndWorkDate(eq(tenantId), any(LocalDate.class)))
                .thenReturn(List.of());
        when(attendanceRecordRepository.countByCompanyIdAndWorkDateBetween(eq(tenantId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(employeeService.getActiveVsPendingCounts())
                .thenReturn(new EmployeeCounts(0, 0, 0));

        AttendanceComplianceData result = attendanceService.getAttendanceCompliance();

        assertEquals(0.0, result.getComplianceRate(), 0.001);
    }
}
