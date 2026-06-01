package com.guoren.workflow.dms.dto;

import lombok.Data;

/**
 * DMS 分类保存 / 更新入参
 */
@Data
public class DmsCategoryDTO {

    private String parentId;

    private String name;

    private Integer sortNo;
}
