package com.guoren.workflow.solution.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 方案列表项
 */
@Data
public class SolutionListItemVO {

    private String id;

    private String solutionCode;

    private String name;

    private String tenantId;

    private String tenantName;

    private String description;

    private String status;

    private String owner;

    private LocalDate goLiveDate;

    private Integer appCount;

    private Integer pendingAppCount;

    private LocalDateTime updateTime;
}
