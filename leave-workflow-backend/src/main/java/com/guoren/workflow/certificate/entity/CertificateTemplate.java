package com.guoren.workflow.certificate.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 证书模版主表
 */
@Data
@TableName("certificate_template")
public class CertificateTemplate {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 业务唯一标识 */
    private String tplKey;

    private String name;

    /** 底图 URL，相对路径，例如 /uploads/certificates/xxx.png */
    private String bgUrl;

    private Integer width;

    private Integer height;

    /** 字段定义 JSON：[{key,label,sample}, ...] */
    private String fieldsJson;

    /** fabric 画布 JSON */
    private String canvasJson;

    /** 缩略图 dataURL */
    private String thumbnail;

    private String createBy;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
