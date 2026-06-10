package com.guoren.workflow.solution.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 解决方案详情
 */
@Data
public class SolutionDetailVO {

    private String id;

    private String solutionCode;

    private String name;

    private String tenantId;

    private String tenantName;

    private String description;

    private String status;

    private String owner;

    private LocalDate goLiveDate;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private List<SolutionInstalledAppVO> installedApps = new ArrayList<>();
}
