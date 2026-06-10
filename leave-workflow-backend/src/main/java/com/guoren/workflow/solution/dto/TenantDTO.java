package com.guoren.workflow.solution.dto;

import lombok.Data;

/**
 * 租户保存/更新入参
 */
@Data
public class TenantDTO {

    private String tenantCode;

    private String name;

    private String contactName;

    private String contactPhone;

    private String industry;

    private String status;

    private String remark;
}
