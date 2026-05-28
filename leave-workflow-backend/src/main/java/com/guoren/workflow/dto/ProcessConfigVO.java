package com.guoren.workflow.dto;

import lombok.Data;

/**
 * 流程配置 VO（返回给前端）
 * 包含主表信息 + 版本号 + Flowable 关联信息
 */
@Data
public class ProcessConfigVO {

    private String id;

    /** 流程标识 */
    private String processKey;

    /** 流程名称 */
    private String name;

    /** 流程分组 */
    private String processGroup;

    /** 描述 */
    private String description;

    /** 图标 */
    private String icon;

    /** 表单 schema JSON */
    private String formSchemaJson;

    /** 流程 JSON */
    private String flowJson;

    /** 高级设置 JSON */
    private String settingsJson;

    /** 最新已发布版本号 */
    private Integer latestVersion;

    /** 状态：DRAFT / PUBLISHED */
    private String status;

    /** Flowable 最新部署 ID */
    private String flowableDeploymentId;

    /** Flowable 最新流程定义 ID */
    private String flowableProcessDefId;

    private String createBy;

    private String createTime;

    private String updateTime;
}
