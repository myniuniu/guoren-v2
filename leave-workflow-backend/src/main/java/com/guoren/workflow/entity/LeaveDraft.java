package com.guoren.workflow.entity;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 请假草稿实体（提交流程前的可编辑记录）
 */
@Data
public class LeaveDraft {

    /** 草稿ID */
    private String id;

    /** 申请人 */
    private String applicant;

    /** 请假类型：sick/annual/personal/other */
    private String leaveType;

    /** 开始日期 */
    private LocalDate startDate;

    /** 结束日期 */
    private LocalDate endDate;

    /** 请假天数 */
    private Double days;

    /** 请假原因 */
    private String reason;

    /** 草稿状态：draft（草稿）、submitted（已提交流程） */
    private String status;

    /** 关联的流程实例ID（提交后才有） */
    private String processInstanceId;

    /** 创建时间 */
    private LocalDateTime createTime;

    /** 更新时间 */
    private LocalDateTime updateTime;
}
