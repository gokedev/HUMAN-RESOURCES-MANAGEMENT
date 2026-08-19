package com.hrsaas.dto;

import com.hrsaas.enums.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalanceDto {
    private LeaveType leaveType;
    private int entitlement;
    private int used;
    private int pending;
    private int remaining;
}
