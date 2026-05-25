package com.guoren.workflow.certificate.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 证书模版版本快照
 */
@Data
@TableName("certificate_template_version")
public class CertificateTemplateVersion {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String templateId;

    private Integer versionNo;

    /** 完整快照 JSON：{name, bgUrl, width, height, fields, canvasJson, thumbnail} */
    private String snapshotJson;

    private String comment;

    private String createBy;

    private LocalDateTime createTime;
}
