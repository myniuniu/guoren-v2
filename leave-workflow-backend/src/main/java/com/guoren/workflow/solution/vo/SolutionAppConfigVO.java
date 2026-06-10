package com.guoren.workflow.solution.vo;

import lombok.Data;

/**
 * 方案应用配置项视图
 */
@Data
public class SolutionAppConfigVO {

    private String id;

    private String configKey;

    private String configName;

    private String valueType;

    private Boolean required;

    private String defaultValue;

    private String currentValue;

    private String optionsJson;

    private String placeholder;

    private String description;

    private Integer sortNo;
}
