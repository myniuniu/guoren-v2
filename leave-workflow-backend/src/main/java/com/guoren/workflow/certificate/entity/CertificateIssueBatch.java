package com.guoren.workflow.certificate.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 证书发放批次（v1.2）
 * 每次发放（单条/批量）落一条批次记录，明细见 CertificateIssueRecord
 */
@Data
@TableName("certificate_issue_batch")
public class CertificateIssueBatch {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 批次名称，发放时由用户填写或自动生成 */
    private String batchName;

    private String templateId;

    /** 冗余：模版名（便于列表展示） */
    private String templateName;

    /** png / jpg / pdf */
    private String format;

    /** 计划/请求总数 */
    private Integer totalCount;

    /** 成功生成数 */
    private Integer successCount;

    private String remark;

    /** COMPLETED / PARTIAL / FAILED */
    private String status;

    private String createBy;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
