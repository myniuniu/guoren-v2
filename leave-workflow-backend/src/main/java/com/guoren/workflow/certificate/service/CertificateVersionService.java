package com.guoren.workflow.certificate.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guoren.workflow.certificate.entity.CertificateTemplate;
import com.guoren.workflow.certificate.entity.CertificateTemplateVersion;
import com.guoren.workflow.certificate.mapper.CertificateTemplateMapper;
import com.guoren.workflow.certificate.mapper.CertificateTemplateVersionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 模版版本管理服务（D2）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateVersionService {

    private final CertificateTemplateVersionMapper versionMapper;
    private final CertificateTemplateMapper templateMapper;
    private final ObjectMapper om = new ObjectMapper();

    /** 保存当前模版为新版本 */
    @Transactional
    public CertificateTemplateVersion snapshot(CertificateTemplate t, String comment) {
        if (t == null) throw new IllegalArgumentException("模版不存在");
        Integer next = nextVersionNo(t.getId());
        CertificateTemplateVersion v = new CertificateTemplateVersion();
        v.setTemplateId(t.getId());
        v.setVersionNo(next);
        v.setSnapshotJson(buildSnapshot(t));
        v.setComment(comment);
        v.setCreateBy(t.getCreateBy());
        v.setCreateTime(LocalDateTime.now());
        versionMapper.insert(v);
        return v;
    }

    public List<Map<String, Object>> list(String templateId) {
        LambdaQueryWrapper<CertificateTemplateVersion> w = new LambdaQueryWrapper<>();
        w.eq(CertificateTemplateVersion::getTemplateId, templateId)
                .orderByDesc(CertificateTemplateVersion::getVersionNo);
        List<CertificateTemplateVersion> rows = versionMapper.selectList(w);
        List<Map<String, Object>> ret = new ArrayList<>(rows.size());
        for (CertificateTemplateVersion v : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", v.getId());
            m.put("templateId", v.getTemplateId());
            m.put("versionNo", v.getVersionNo());
            m.put("comment", v.getComment());
            m.put("createBy", v.getCreateBy());
            m.put("createTime", v.getCreateTime());
            ret.add(m);
        }
        return ret;
    }

    public Map<String, Object> detail(String templateId, Integer versionNo) {
        CertificateTemplateVersion v = findOne(templateId, versionNo);
        if (v == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", v.getId());
        m.put("templateId", v.getTemplateId());
        m.put("versionNo", v.getVersionNo());
        m.put("comment", v.getComment());
        m.put("snapshot", parseJson(v.getSnapshotJson()));
        m.put("createTime", v.getCreateTime());
        return m;
    }

    /** 把指定版本回滚到主表 */
    @Transactional
    public CertificateTemplate rollback(String templateId, Integer versionNo) {
        CertificateTemplate t = templateMapper.selectById(templateId);
        if (t == null) throw new IllegalArgumentException("模版不存在");
        CertificateTemplateVersion v = findOne(templateId, versionNo);
        if (v == null) throw new IllegalArgumentException("版本不存在");
        try {
            Map<?, ?> snap = om.readValue(v.getSnapshotJson(), Map.class);
            if (snap.get("name") != null) t.setName(String.valueOf(snap.get("name")));
            if (snap.get("bgUrl") != null) t.setBgUrl(String.valueOf(snap.get("bgUrl")));
            if (snap.get("width") != null) t.setWidth(((Number) snap.get("width")).intValue());
            if (snap.get("height") != null) t.setHeight(((Number) snap.get("height")).intValue());
            if (snap.get("fields") != null) t.setFieldsJson(om.writeValueAsString(snap.get("fields")));
            if (snap.get("canvasJson") != null) t.setCanvasJson(om.writeValueAsString(snap.get("canvasJson")));
            if (snap.get("thumbnail") != null) t.setThumbnail(String.valueOf(snap.get("thumbnail")));
            t.setUpdateTime(LocalDateTime.now());
            templateMapper.updateById(t);
            // 回滚后再保存一个新版本，避免历史断裂
            snapshot(t, "回滚自 v" + versionNo);
        } catch (Exception e) {
            throw new RuntimeException("回滚失败：" + e.getMessage(), e);
        }
        return t;
    }

    private Integer nextVersionNo(String templateId) {
        LambdaQueryWrapper<CertificateTemplateVersion> w = new LambdaQueryWrapper<>();
        w.eq(CertificateTemplateVersion::getTemplateId, templateId)
                .orderByDesc(CertificateTemplateVersion::getVersionNo)
                .last("limit 1");
        CertificateTemplateVersion last = versionMapper.selectOne(w);
        return last == null ? 1 : last.getVersionNo() + 1;
    }

    private CertificateTemplateVersion findOne(String templateId, Integer versionNo) {
        LambdaQueryWrapper<CertificateTemplateVersion> w = new LambdaQueryWrapper<>();
        w.eq(CertificateTemplateVersion::getTemplateId, templateId)
                .eq(CertificateTemplateVersion::getVersionNo, versionNo)
                .last("limit 1");
        return versionMapper.selectOne(w);
    }

    private String buildSnapshot(CertificateTemplate t) {
        try {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", t.getName());
            m.put("bgUrl", t.getBgUrl());
            m.put("width", t.getWidth());
            m.put("height", t.getHeight());
            m.put("fields", parseJson(t.getFieldsJson()));
            m.put("canvasJson", parseJson(t.getCanvasJson()));
            m.put("thumbnail", t.getThumbnail());
            return om.writeValueAsString(m);
        } catch (Exception e) {
            log.warn("快照序列化失败", e);
            return "{}";
        }
    }

    private Object parseJson(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return om.readValue(s, Object.class);
        } catch (Exception e) {
            return null;
        }
    }
}
