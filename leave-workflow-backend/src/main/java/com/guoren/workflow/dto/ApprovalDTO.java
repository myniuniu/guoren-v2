package com.guoren.workflow.dto;

import lombok.Data;

/**
 * 审批操作DTO
 */
@Data
public class ApprovalDTO {

    /** 任务ID */
    private String taskId;

    /** 审批人 */
    private String approver;

    /** 是否同意 */
    private Boolean approved;

    /** 审批意见 */
    private String comment;
}
