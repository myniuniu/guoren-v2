package com.guoren.workflow.dms.dto;

import lombok.Data;

/**
 * DMS 文档列表查询参数
 */
@Data
public class DmsDocumentQueryDTO {

    private String keyword;

    private String docType;

    private String status;

    /** 选中分类后递归包含子分类 */
    private String categoryId;

    /** 按标签名过滤（走 dms_doc_tag） */
    private String tagName;

    private Integer page = 1;

    private Integer size = 10;
}
