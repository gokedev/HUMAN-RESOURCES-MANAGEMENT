package com.hrsaas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class CreateEmployeeRequest {

    @NotBlank
    @Email
    @Size(max = 200)
    private String email;

    @NotBlank
    @Size(max = 100)
    private String firstName;

    @NotBlank
    @Size(max = 100)
    private String lastName;

    @Size(max = 30)
    private String phone;

    @Size(max = 120)
    private String jobTitle;

    private UUID departmentId;

    private UUID managerId;

    private LocalDate dateOfHire;

    private BigDecimal baseSalary;
}
