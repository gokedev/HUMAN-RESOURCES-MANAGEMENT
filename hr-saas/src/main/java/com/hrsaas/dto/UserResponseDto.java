package com.hrsaas.dto;

import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDto {

    private UUID id;
    private String email;
    private Role role;
    private UserStatus status;
    private String firstName;
    private String lastName;
    private String phone;
    private String jobTitle;
    private UUID departmentId;
    private UUID managerId;
    private LocalDate dateOfHire;
    private BigDecimal baseSalary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserResponseDto fromEntity(com.hrsaas.entity.User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .jobTitle(user.getJobTitle())
                .departmentId(user.getDepartmentId())
                .managerId(user.getManagerId())
                .dateOfHire(user.getDateOfHire())
                .baseSalary(user.getBaseSalary())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
