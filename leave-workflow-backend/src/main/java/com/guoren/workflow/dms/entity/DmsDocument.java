package com.guoren.workflow.dms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DMS 文档主表实体
 */
@Data
@TableName("dms_document")
public class DmsDocument {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 业务编号，如 DMS-20260101-0001 */
    private String docNo;

    private String title;

    private String categoryId;

    /** policy / contract / report / design / other */
    private String docType;

    /** 逗号分隔的标签 */
    private String tags;

    private String description;

    private String fileUrl;

    private String fileName;

    private Long fileSize;

    private String mime;

    /** DRAFT / PENDING / PUBLISHED / REJECTED / ARCHIVED */
    private String status;

    private Integer latestVersion;

    /** 下一轮接入 Flowable 时回写 */
    private String processInstanceId;

    private String createBy;

    private String createDept;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
