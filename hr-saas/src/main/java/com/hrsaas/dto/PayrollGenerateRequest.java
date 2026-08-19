package com.hrsaas.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PayrollGenerateRequest {

    @Min(1) @Max(12)
    private int month;

    @Min(2020) @Max(2099)
    private int year;

    private boolean overwriteExisting;
}
