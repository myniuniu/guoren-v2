package com.guoren.workflow.dms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DMS 文档版本快照
 */
@Data
@TableName("dms_document_version")
public class DmsDocumentVersion {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String documentId;

    private Integer versionNo;

    private String fileUrl;

    private String fileName;

    private Long fileSize;

    private String mime;

    private String changeLog;

    private String createBy;

    private LocalDateTime createTime;
}
