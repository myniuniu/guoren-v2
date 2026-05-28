package com.guoren.workflow.dto;

import lombok.Data;

/**
 * 保存流程配置请求 DTO
 * 前端实时保存草稿时调用，直接覆盖 process_config 主表的草稿数据
 */
@Data
public class ProcessConfigSaveDTO {

    /** 流程标识（唯一） */
    private String processKey;

    /** 流程名称 */
    private String name;

    /** 流程分组 */
    private String processGroup;

    /** 描述 */
    private String description;

    /** 图标 */
    private String icon;

    /** 表单设计 schema JSON */
    private String formSchemaJson;

    /** 流程设计 JSON */
    private String flowJson;

    /** 高级设置 JSON */
    private String settingsJson;
}
