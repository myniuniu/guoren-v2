package com.guoren.workflow.solution.dto;

import lombok.Data;

import java.util.List;

/**
 * 方案安装应用入参
 */
@Data
public class SolutionAppDTO {

    private String id;

    private String appId;

    private Integer sortNo;

    private String deployStatus;

    private Boolean installRequired;

    private String remark;

    private List<SolutionAppConfigDTO> configs;
}
