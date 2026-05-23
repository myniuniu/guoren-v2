package com.guoren.workflow.dto;

import lombok.Data;

/**
 * 流程部署请求DTO
 */
@Data
public class DeployRequestDTO {

    /** 流程名称 */
    private String name;

    /** BPMN XML内容 */
    private String xml;
}
