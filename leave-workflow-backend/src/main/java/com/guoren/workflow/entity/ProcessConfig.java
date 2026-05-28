package com.guoren.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 流程配置主表（保存最新草稿）
 * 每次编辑直接覆盖，发布时从当前草稿生成版本快照
 */
@Data
@TableName("process_config")
public class ProcessConfig {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 流程标识（唯一，与 Flowable processDefinitionKey 对应） */
    private String processKey;

    /** 流程名称 */
    private String name;

    /** 流程分组 */
    private String processGroup;

    /** 描述 */
    private String description;

    /** 图标 */
    private String icon;

    /** 表单设计 schema JSON（草稿） */
    private String formSchemaJson;

    /** 流程设计 JSON（草稿） */
    private String flowJson;

    /** 高级设置 JSON（草稿） */
    private String settingsJson;

    /** 最新已发布版本号 */
    private Integer latestVersion;

    /** 状态：DRAFT / PUBLISHED */
    private String status;

    private String createBy;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /** 逻辑删除：0=正常，1=已删除 */
    private Integer deleted;
}
