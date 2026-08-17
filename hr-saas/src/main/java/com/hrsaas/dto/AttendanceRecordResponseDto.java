package com.hrsaas.dto;

import com.hrsaas.enums.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecordResponseDto {

    private UUID id;
    private UUID employeeId;
    private LocalDate workDate;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private AttendanceStatus status;
    private LocalDateTime createdAt;

    public static AttendanceRecordResponseDto fromEntity(com.hrsaas.entity.AttendanceRecord record) {
        return AttendanceRecordResponseDto.builder()
                .id(record.getId())
                .employeeId(record.getEmployeeId())
                .workDate(record.getWorkDate())
                .checkIn(record.getCheckIn())
                .checkOut(record.getCheckOut())
                .status(record.getStatus())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
