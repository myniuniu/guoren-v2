package com.guoren.workflow.dto;

import lombok.Data;

/**
 * 发布流程配置请求 DTO
 * 前端点击"发布"时调用，生成版本快照并部署 BPMN 到 Flowable
 */
@Data
public class ProcessConfigPublishDTO {

    /** 流程标识 */
    private String processKey;

    /** 部署名称（用于 Flowable deployment name） */
    private String deployName;

    /** BPMN XML（前端生成好传过来） */
    private String bpmnXml;

    /** 流程名称 */
    private String name;

    /** 流程分组 */
    private String processGroup;

    /** 描述 */
    private String description;

    /** 图标 */
    private String icon;

    /** 表单设计 schema JSON（发布时刻快照） */
    private String formSchemaJson;

    /** 流程设计 JSON（发布时刻快照） */
    private String flowJson;

    /** 高级设置 JSON（发布时刻快照） */
    private String settingsJson;
}
