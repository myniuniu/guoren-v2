package com.guoren.workflow.certificate.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 模版保存/更新入参
 */
@Data
public class CertificateTemplateDTO {

    private String name;

    private String tplKey;

    private String bgUrl;

    private Integer width;

    private Integer height;

    /** [{key,label,sample}, ...] */
    private List<Map<String, Object>> fields;

    /** fabric.Canvas.toJSON 结果 */
    private Map<String, Object> canvasJson;

    /** 前端生成的缩略图 dataURL */
    private String thumbnail;

    private String createBy;
}
