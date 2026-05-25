package com.guoren.workflow.certificate.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 证书发放明细（v1.2）
 * 一条记录 = 一张已生成的证书
 */
@Data
@TableName("certificate_issue_record")
public class CertificateIssueRecord {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String batchId;

    private String templateId;

    /** 证书编号（如开启自动编号则填充结果） */
    private String certNo;

    /** 持证人姓名（自动从 data 中常见字段提取） */
    private String recipient;

    /** 渲染时使用的字段数据 JSON */
    private String dataJson;

    private String fileName;

    private String mime;

    private String format;

    /** 生成的证书原文，base64 字符串（不带 data: 前缀） */
    private String fileBase64;

    /** SUCCESS / FAILED */
    private String status;

    private String errorMsg;

    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
