package com.guoren.workflow.controller;

import com.guoren.workflow.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 通用文件上传接口：
 * <pre>
 * POST /api/file/upload   form-data: file=xxx, biz=resource-lib | cert-bg | cert-record
 * 返回：{ url, fileName, size, mime, storage }
 * </pre>
 */
@Slf4j
@RestController
@RequestMapping("/api/file")
public class FileUploadController {

    @Autowired
    private FileStorageService storage;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "biz", defaultValue = "common") String biz) {
        try {
            FileStorageService.UploadResult r = storage.upload(file, biz);
            Map<String, Object> body = new HashMap<>();
            body.put("url", r.getUrl());
            body.put("fileName", r.getFileName());
            body.put("size", r.getSize());
            body.put("mime", r.getMime());
            body.put("storage", r.getStorage());
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            log.error("文件上传失败", e);
            Map<String, Object> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    @GetMapping("/oss-status")
    public Map<String, Object> ossStatus() {
        Map<String, Object> m = new HashMap<>();
        m.put("ossEnabled", storage.isOssEnabled());
        return m;
    }
}
