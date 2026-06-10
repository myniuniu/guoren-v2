package com.guoren.workflow.solution.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 方案应用配置项
 */
@Data
@TableName("solution_app_config")
public class SolutionAppConfig {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String solutionAppId;

    private String configKey;

    private String configName;

    /** STRING / NUMBER / BOOLEAN / SELECT / PASSWORD / URL / JSON */
    private String valueType;

    private Boolean required;

    private String defaultValue;

    private String currentValue;

    private String optionsJson;

    private String placeholder;

    private String description;

    private Integer sortNo;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
