package com.guoren.workflow.dms.dto;

import lombok.Data;

/**
 * DMS 文档保存/更新入参
 */
@Data
public class DmsDocumentDTO {

    private String title;

    private String categoryId;

    private String docType;

    /** 逗号分隔或前端数组 join */
    private String tags;

    private String description;

    private String fileUrl;

    private String fileName;

    private Long fileSize;

    private String mime;

    private String createBy;

    private String createDept;

    /** 编辑时上传新文件说明，仅在版本升级时写入快照 */
    private String changeLog;
}
