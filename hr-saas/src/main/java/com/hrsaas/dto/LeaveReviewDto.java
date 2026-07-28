package com.hrsaas.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeaveReviewDto {

    @NotNull
    private boolean approve;

    private String note;
}
