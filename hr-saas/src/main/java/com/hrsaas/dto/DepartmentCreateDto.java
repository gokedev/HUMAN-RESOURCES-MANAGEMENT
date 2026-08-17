package com.hrsaas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentCreateDto {

    @NotBlank
    @Size(max = 150)
    private String name;
}
