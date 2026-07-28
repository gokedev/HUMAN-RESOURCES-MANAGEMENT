package com.hrsaas.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank
    @jakarta.validation.constraints.Email
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String companySlug;
}
