package com.guoren.workflow.certificate.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 证书流水号规则
 * rulePattern 支持占位符：{yyyyMMdd}、{yyyy}、{MM}、{dd}、{seq:0000}（按宽度补零）
 */
@Data
@TableName("certificate_seq")
public class CertificateSeq {

    @TableId(value = "rule_key", type = IdType.INPUT)
    private String ruleKey;

    private String rulePattern;

    private Long currentSeq;

    private LocalDateTime updateTime;
}
