package com.guoren.workflow.solution.dto;

import lombok.Data;

/**
 * 应用目录保存/更新入参
 */
@Data
public class AppCatalogDTO {

    private String appCode;

    private String name;

    private String category;

    private String description;

    private String icon;

    private String status;
}
