package com.guoren.workflow.certificate.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 证书发放渲染入参
 */
@Data
public class IssueRequestDTO {

    private String templateId;

    /** 单条数据 */
    private Map<String, Object> data;

    /** 批量数据 */
    private List<Map<String, Object>> dataList;

    /** 导出格式：png | jpg | pdf（默认 png） */
    private String format;

    /** JPG/PNG 压缩质量 0.0~1.0，仅 jpg 生效 */
    private Float quality;
}
