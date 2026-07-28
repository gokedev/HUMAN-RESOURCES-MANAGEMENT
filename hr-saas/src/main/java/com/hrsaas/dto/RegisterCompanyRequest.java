package com.hrsaas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterCompanyRequest {

    @NotBlank
    private String companyName;

    private String industry;

    private String country;

    @NotBlank
    private String adminFirstName;

    @NotBlank
    private String adminLastName;

    @NotBlank
    @Email
    private String adminEmail;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String adminPassword;
}
