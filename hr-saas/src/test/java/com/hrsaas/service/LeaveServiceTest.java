package com.hrsaas.service;

import com.hrsaas.dto.LeaveRequestCreateDto;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.enums.LeaveStatus;
import com.hrsaas.enums.LeaveType;
import com.hrsaas.repository.LeaveRequestRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveServiceTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MailService mailService;

    @InjectMocks
    private LeaveService leaveService;

    private UUID tenantId;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        TenantContext.setTenantId(tenantId);
        TenantContext.setUserId(employeeId);
    }

    @Test
    void createLeaveRequest_Success() {
        LeaveRequestCreateDto dto = new LeaveRequestCreateDto();
        dto.setLeaveType(LeaveType.ANNUAL);
        dto.setStartDate(LocalDate.now().plusDays(1));
        dto.setEndDate(LocalDate.now().plusDays(5));
        dto.setReason("Vacation");

        LeaveRequest savedRequest = LeaveRequest.builder()
                .id(UUID.randomUUID())
                .companyId(tenantId)
                .employeeId(employeeId)
                .leaveType(LeaveType.ANNUAL)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason("Vacation")
                .status(LeaveStatus.PENDING)
                .build();

        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenReturn(savedRequest);

        LeaveRequest result = leaveService.createLeaveRequest(dto);

        assertNotNull(result);
        assertEquals(LeaveType.ANNUAL, result.getLeaveType());
        assertEquals(LeaveStatus.PENDING, result.getStatus());
    }

    @Test
    void createLeaveRequest_EndDateBeforeStartDate() {
        LeaveRequestCreateDto dto = new LeaveRequestCreateDto();
        dto.setLeaveType(LeaveType.ANNUAL);
        dto.setStartDate(LocalDate.now().plusDays(5));
        dto.setEndDate(LocalDate.now().plusDays(1));

        assertThrows(com.hrsaas.exception.ApiException.class, 
                () -> leaveService.createLeaveRequest(dto));
    }
}
