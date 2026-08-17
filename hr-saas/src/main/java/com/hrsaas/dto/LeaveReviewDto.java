package com.hrsaas.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeaveReviewDto {

    private boolean approve;

    @Size(max = 500)
    private String note;
}
