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
    @Size(max = 150)
    private String companyName;

    @Size(max = 100)
    private String industry;

    @Size(max = 100)
    private String country;

    @NotBlank
    @Size(max = 100)
    private String adminFirstName;

    @NotBlank
    @Size(max = 100)
    private String adminLastName;

    @NotBlank
    @Email
    @Size(max = 200)
    private String adminEmail;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String adminPassword;
}
