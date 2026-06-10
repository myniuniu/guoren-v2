package com.guoren.workflow.solution.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * 解决方案保存/更新入参
 */
@Data
public class SolutionDTO {

    private String solutionCode;

    private String name;

    private String tenantId;

    private String description;

    private String status;

    private String owner;

    private LocalDate goLiveDate;
}
