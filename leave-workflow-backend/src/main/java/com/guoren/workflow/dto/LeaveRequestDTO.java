package com.guoren.workflow.dto;

import lombok.Data;
import java.time.LocalDate;

/**
 * 提交请假申请DTO
 */
@Data
public class LeaveRequestDTO {

    /** 申请人 */
    private String applicant;

    /** 请假类型 */
    private String leaveType;

    /** 开始日期 */
    private LocalDate startDate;

    /** 结束日期 */
    private LocalDate endDate;

    /** 请假天数 */
    private Integer days;

    /** 请假原因 */
    private String reason;
}
