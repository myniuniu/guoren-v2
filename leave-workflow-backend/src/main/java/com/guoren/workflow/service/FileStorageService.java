package com.guoren.workflow.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ObjectMetadata;
import com.guoren.workflow.config.OssProperties;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 文件存储服务：统一对外提供 upload(...) 接口。
 *
 * <ul>
 *   <li>app.oss.enabled=true：上传到阿里云 OSS，返回 https url</li>
 *   <li>app.oss.enabled=false：写入本地 ./uploads，返回 /uploads/xxx 相对路径</li>
 * </ul>
 */
@Slf4j
@Service
public class FileStorageService {

    private final OssProperties oss;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private OSS ossClient;

    public FileStorageService(OssProperties oss) {
        this.oss = oss;
    }

    @PostConstruct
    public void init() {
        if (oss.isEnabled()) {
            if (oss.getEndpoint().isBlank() || oss.getBucket().isBlank()
                    || oss.getAccessKeyId().isBlank() || oss.getAccessKeySecret().isBlank()) {
                log.warn("OSS enabled=true 但配置不完整，回退到本地存储");
                return;
            }
            this.ossClient = new OSSClientBuilder()
                    .build(oss.getEndpoint(), oss.getAccessKeyId(), oss.getAccessKeySecret());
            log.info("OSS 客户端已初始化，bucket={}, endpoint={}", oss.getBucket(), oss.getEndpoint());
        } else {
            log.info("OSS 未启用，走本地存储 dir={}", uploadDir);
        }
    }

    @PreDestroy
    public void destroy() {
        if (ossClient != null) {
            ossClient.shutdown();
        }
    }

    /** 上传 MultipartFile，返回外链 url（OSS 时是 https，本地时是 /uploads/xxx） */
    public UploadResult upload(MultipartFile file, String bizDir) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("文件为空");
        String originName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String ext = "";
        int dot = originName.lastIndexOf('.');
        if (dot > 0 && dot < originName.length() - 1) ext = originName.substring(dot);
        String safeBiz = bizDir == null || bizDir.isBlank() ? "common" : bizDir.replaceAll("[^a-zA-Z0-9_-]", "");
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String shortId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String key = String.format("%s/%s/%s%s", safeBiz, date, shortId, ext);

        UploadResult r = new UploadResult();
        r.setFileName(originName);
        r.setSize(file.getSize());
        r.setMime(file.getContentType() == null ? "application/octet-stream" : file.getContentType());

        if (ossClient != null) {
            String fullKey = oss.getKeyPrefix() + key;
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(file.getSize());
            meta.setContentType(r.getMime());
            try (InputStream in = file.getInputStream()) {
                ossClient.putObject(oss.getBucket(), fullKey, in, meta);
            }
            r.setUrl(buildOssUrl(fullKey));
            r.setStorage("oss");
            r.setObjectKey(fullKey);
        } else {
            // 本地兜底
            Path dir = Paths.get(uploadDir, safeBiz, date).toAbsolutePath();
            Files.createDirectories(dir);
            Path target = dir.resolve(shortId + ext);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target);
            }
            r.setUrl("/uploads/" + safeBiz + "/" + date + "/" + shortId + ext);
            r.setStorage("local");
            r.setObjectKey(target.toString());
        }
        return r;
    }

    /** 上传字节数组，主要给后端渲染流程（如证书 PNG）使用 */
    public UploadResult uploadBytes(byte[] bytes, String fileName, String mime, String bizDir) throws IOException {
        if (bytes == null || bytes.length == 0) throw new IllegalArgumentException("字节数组为空");
        String name = fileName == null ? "file" : fileName;
        String ext = "";
        int dot = name.lastIndexOf('.');
        if (dot > 0 && dot < name.length() - 1) ext = name.substring(dot);
        String safeBiz = bizDir == null || bizDir.isBlank() ? "common" : bizDir.replaceAll("[^a-zA-Z0-9_-]", "");
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String shortId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String key = String.format("%s/%s/%s%s", safeBiz, date, shortId, ext);

        UploadResult r = new UploadResult();
        r.setFileName(name);
        r.setSize((long) bytes.length);
        r.setMime(mime == null ? "application/octet-stream" : mime);

        if (ossClient != null) {
            String fullKey = oss.getKeyPrefix() + key;
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(bytes.length);
            meta.setContentType(r.getMime());
            ossClient.putObject(oss.getBucket(), fullKey, new java.io.ByteArrayInputStream(bytes), meta);
            r.setUrl(buildOssUrl(fullKey));
            r.setStorage("oss");
            r.setObjectKey(fullKey);
        } else {
            Path dir = Paths.get(uploadDir, safeBiz, date).toAbsolutePath();
            Files.createDirectories(dir);
            Path target = dir.resolve(shortId + ext);
            Files.write(target, bytes);
            r.setUrl("/uploads/" + safeBiz + "/" + date + "/" + shortId + ext);
            r.setStorage("local");
            r.setObjectKey(target.toString());
        }
        return r;
    }

    private String buildOssUrl(String fullKey) {
        if (!oss.getCustomDomain().isBlank()) {
            String base = oss.getCustomDomain();
            if (!base.endsWith("/")) base = base + "/";
            return base + fullKey;
        }
        return String.format("https://%s.%s/%s", oss.getBucket(), oss.getEndpoint(), fullKey);
    }

    public boolean isOssEnabled() {
        return ossClient != null;
    }

    /** 上传结果 */
    @lombok.Data
    public static class UploadResult {
        private String url;
        private String fileName;
        private Long size;
        private String mime;
        /** "oss" 或 "local" */
        private String storage;
        /** OSS Object Key 或本地绝对路径 */
        private String objectKey;
    }
}
