package com.guoren.workflow.entity;

import lombok.Data;

/**
 * 流程定义实体
 */
@Data
public class ProcessDefinitionVO {

    /** 流程定义ID */
    private String id;

    /** 流程标识key */
    private String key;

    /** 流程名称 */
    private String name;

    /** 版本号 */
    private Integer version;

    /** 部署ID */
    private String deploymentId;

    /** 资源名称 */
    private String resourceName;

    /** 挂起状态: 1=激活, 0=挂起 */
    private Integer suspensionState;
}
