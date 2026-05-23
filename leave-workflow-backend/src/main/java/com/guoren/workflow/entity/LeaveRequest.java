package com.guoren.workflow.entity;

import lombok.Data;
import java.time.LocalDate;

/**
 * 请假申请实体
 */
@Data
public class LeaveRequest {

    /** 流程实例ID */
    private String processInstanceId;

    /** 申请人 */
    private String applicant;

    /** 请假类型：sick(病假), annual(年假), personal(事假), other(其他) */
    private String leaveType;

    /** 开始日期 */
    private LocalDate startDate;

    /** 结束日期 */
    private LocalDate endDate;

    /** 请假天数 */
    private Integer days;

    /** 请假原因 */
    private String reason;

    /** 当前状态 */
    private String status;

    /** 当前任务ID */
    private String taskId;

    /** 当前任务名称 */
    private String taskName;
}
