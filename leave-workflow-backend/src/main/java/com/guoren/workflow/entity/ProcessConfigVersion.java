package com.guoren.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 流程配置版本快照表
 * 每次发布生成一条不可变记录，确保配置与 Flowable 部署的版本一一对应
 */
@Data
@TableName("process_config_version")
public class ProcessConfigVersion {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 关联 process_config.id */
    private String configId;

    /** 流程标识 */
    private String processKey;

    /** 版本号（每次发布 +1） */
    private Integer version;

    /** 快照：表单 schema JSON */
    private String formSchemaJson;

    /** 快照：流程 JSON */
    private String flowJson;

    /** 快照：高级设置 JSON */
    private String settingsJson;

    /** 快照：生成的 BPMN XML */
    private String bpmnXml;

    /** Flowable 部署 ID */
    private String flowableDeploymentId;

    /** Flowable 流程定义 ID */
    private String flowableProcessDefId;

    /** 是否已发布：0=否，1=是 */
    private Integer published;

    /** 发布时间 */
    private LocalDateTime publishTime;

    private String createBy;

    private LocalDateTime createTime;
}
