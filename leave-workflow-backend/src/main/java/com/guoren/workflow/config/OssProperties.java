package com.guoren.workflow.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 阿里云 OSS 配置项。
 *
 * <p>所有字段均通过环境变量注入，未配置时 enabled=false，回退到本地 ./uploads。
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.oss")
public class OssProperties {

    /** 是否启用 OSS。false 时走本地存储兜底（仅用于开发/演示）。 */
    private boolean enabled = false;

    /** OSS 接入点，例如 oss-cn-hangzhou.aliyuncs.com */
    private String endpoint = "";

    /** Bucket 名称 */
    private String bucket = "";

    private String accessKeyId = "";
    private String accessKeySecret = "";

    /** Key 前缀，例如 guoren/ */
    private String keyPrefix = "guoren/";

    /** 自定义访问域名（可选）。不填时使用 https://{bucket}.{endpoint}/{key} */
    private String customDomain = "";
}
