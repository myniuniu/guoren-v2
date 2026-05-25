package com.guoren.workflow.certificate.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guoren.workflow.certificate.dto.CertificateTemplateDTO;
import com.guoren.workflow.certificate.entity.CertificateTemplate;
import com.guoren.workflow.certificate.mapper.CertificateTemplateMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 证书模版服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateTemplateService {

    private final CertificateTemplateMapper mapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public CertificateTemplate create(CertificateTemplateDTO dto) {
        CertificateTemplate t = new CertificateTemplate();
        t.setName(dto.getName());
        t.setTplKey(generateKey(dto.getTplKey()));
        t.setBgUrl(dto.getBgUrl());
        t.setWidth(dto.getWidth() == null ? 1123 : dto.getWidth());
        t.setHeight(dto.getHeight() == null ? 794 : dto.getHeight());
        t.setFieldsJson(toJson(dto.getFields()));
        t.setCanvasJson(toJson(dto.getCanvasJson()));
        t.setThumbnail(dto.getThumbnail());
        t.setCreateBy(dto.getCreateBy());
        t.setCreateTime(LocalDateTime.now());
        t.setUpdateTime(LocalDateTime.now());
        mapper.insert(t);
        return t;
    }

    @Transactional
    public CertificateTemplate update(String id, CertificateTemplateDTO dto) {
        CertificateTemplate t = mapper.selectById(id);
        if (t == null) {
            throw new IllegalArgumentException("模版不存在: " + id);
        }
        if (dto.getName() != null) t.setName(dto.getName());
        if (dto.getBgUrl() != null) t.setBgUrl(dto.getBgUrl());
        if (dto.getWidth() != null) t.setWidth(dto.getWidth());
        if (dto.getHeight() != null) t.setHeight(dto.getHeight());
        if (dto.getFields() != null) t.setFieldsJson(toJson(dto.getFields()));
        if (dto.getCanvasJson() != null) t.setCanvasJson(toJson(dto.getCanvasJson()));
        if (dto.getThumbnail() != null) t.setThumbnail(dto.getThumbnail());
        t.setUpdateTime(LocalDateTime.now());
        mapper.updateById(t);
        return t;
    }

    public List<Map<String, Object>> list(String keyword) {
        LambdaQueryWrapper<CertificateTemplate> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            wrapper.like(CertificateTemplate::getName, keyword);
        }
        wrapper.orderByDesc(CertificateTemplate::getUpdateTime);
        List<CertificateTemplate> rows = mapper.selectList(wrapper);
        java.util.List<Map<String, Object>> ret = new java.util.ArrayList<>();
        for (CertificateTemplate t : rows) {
            ret.add(toListVO(t));
        }
        return ret;
    }

    public Map<String, Object> detail(String id) {
        CertificateTemplate t = mapper.selectById(id);
        if (t == null) return null;
        return toDetailVO(t);
    }

    public CertificateTemplate getEntity(String id) {
        return mapper.selectById(id);
    }

    @Transactional
    public void delete(String id) {
        mapper.deleteById(id);
    }

    /** 上传底图，返回相对 URL */
    public String upload(MultipartFile file, String uploadDir) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("上传文件为空");
        }
        String original = file.getOriginalFilename();
        String ext = "png";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
        }
        String relative = "certificates/" + UUID.randomUUID().toString().replace("-", "") + "." + ext;
        Path target = new File(uploadDir, relative).toPath();
        Files.createDirectories(target.getParent());
        try (var in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return "/uploads/" + relative;
    }

    private String generateKey(String input) {
        if (input != null && !input.isBlank()) return input;
        return "cert_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String toJson(Object o) {
        if (o == null) return null;
        try {
            return objectMapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            log.warn("toJson 失败", e);
            return null;
        }
    }

    private Map<String, Object> toListVO(CertificateTemplate t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("tplKey", t.getTplKey());
        m.put("name", t.getName());
        m.put("bgUrl", t.getBgUrl());
        m.put("width", t.getWidth());
        m.put("height", t.getHeight());
        m.put("thumbnail", t.getThumbnail());
        m.put("fieldCount", countFields(t.getFieldsJson()));
        m.put("createTime", t.getCreateTime());
        m.put("updateTime", t.getUpdateTime());
        return m;
    }

    private Map<String, Object> toDetailVO(CertificateTemplate t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("tplKey", t.getTplKey());
        m.put("name", t.getName());
        m.put("bgUrl", t.getBgUrl());
        m.put("width", t.getWidth());
        m.put("height", t.getHeight());
        m.put("thumbnail", t.getThumbnail());
        m.put("fields", parseJson(t.getFieldsJson()));
        m.put("canvasJson", parseJson(t.getCanvasJson()));
        m.put("createTime", t.getCreateTime());
        m.put("updateTime", t.getUpdateTime());
        return m;
    }

    private int countFields(String fieldsJson) {
        if (fieldsJson == null || fieldsJson.isBlank()) return 0;
        try {
            Object arr = objectMapper.readValue(fieldsJson, Object.class);
            if (arr instanceof List<?>) return ((List<?>) arr).size();
        } catch (Exception ignore) {
        }
        return 0;
    }

    private Object parseJson(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return objectMapper.readValue(s, Object.class);
        } catch (Exception e) {
            return null;
        }
    }

    /** 仅供 Controller 用：将 fields_json 转为 List 用于回退 sample */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getFieldSamples(CertificateTemplate t) {
        Map<String, Object> samples = new HashMap<>();
        if (t.getFieldsJson() == null) return samples;
        try {
            Object parsed = objectMapper.readValue(t.getFieldsJson(), Object.class);
            if (parsed instanceof List<?>) {
                for (Object item : (List<?>) parsed) {
                    if (item instanceof Map<?, ?> m) {
                        Object key = m.get("key");
                        Object sample = m.get("sample");
                        if (key != null) samples.put(key.toString(), sample);
                    }
                }
            }
        } catch (Exception ignore) {
        }
        return samples;
    }
}
