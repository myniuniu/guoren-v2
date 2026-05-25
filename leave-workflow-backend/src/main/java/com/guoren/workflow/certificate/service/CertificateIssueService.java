package com.guoren.workflow.certificate.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guoren.workflow.certificate.entity.CertificateIssueBatch;
import com.guoren.workflow.certificate.entity.CertificateIssueRecord;
import com.guoren.workflow.certificate.entity.CertificateTemplate;
import com.guoren.workflow.certificate.mapper.CertificateIssueBatchMapper;
import com.guoren.workflow.certificate.mapper.CertificateIssueRecordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 证书发放（批次 + 明细）服务（v1.2）
 * 负责把每次发放过程落库，并提供批次/明细的 CRUD。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateIssueService {

    private final CertificateIssueBatchMapper batchMapper;
    private final CertificateIssueRecordMapper recordMapper;
    private final CertificateTemplateService templateService;
    private final CertificateRenderService renderService;
    private final CertificatePdfService pdfService;
    private final ObjectMapper om = new ObjectMapper();

    private static final String[] RECIPIENT_KEYS = {
            "studentName", "name", "userName", "recipient", "fullName"
    };
    private static final String[] CERT_NO_KEYS = {
            "certNo", "certificateNo", "no", "serialNo"
    };

    /* ========================= 创建批次 ========================= */

    /**
     * 创建一个发放批次并逐条渲染落库。
     *
     * @param templateId 模版 id
     * @param batchName  批次名（为空则用 模版名+时间）
     * @param remark     备注
     * @param format     png/jpg/pdf
     * @param quality    jpg 质量
     * @param dataList   需要发放的数据数组（单条也以数组形式传入）
     * @param createBy   创建人
     */
    @Transactional
    public CertificateIssueBatch createBatch(String templateId,
                                             String batchName,
                                             String remark,
                                             String format,
                                             Float quality,
                                             List<Map<String, Object>> dataList,
                                             String createBy) {
        CertificateTemplate t = templateService.getEntity(templateId);
        if (t == null) throw new IllegalArgumentException("模版不存在：" + templateId);
        if (dataList == null || dataList.isEmpty()) {
            throw new IllegalArgumentException("发放数据不能为空");
        }

        String fmt = (format == null ? "png" : format.toLowerCase());

        CertificateIssueBatch batch = new CertificateIssueBatch();
        batch.setBatchName(buildBatchName(batchName, t.getName()));
        batch.setTemplateId(templateId);
        batch.setTemplateName(t.getName());
        batch.setFormat(fmt);
        batch.setRemark(remark);
        batch.setTotalCount(dataList.size());
        batch.setSuccessCount(0);
        batch.setStatus("COMPLETED");
        batch.setCreateBy(createBy);
        batch.setCreateTime(LocalDateTime.now());
        batch.setUpdateTime(LocalDateTime.now());
        batchMapper.insert(batch);

        int success = 0;
        int idx = 1;
        for (Map<String, Object> data : dataList) {
            CertificateIssueRecord r = new CertificateIssueRecord();
            r.setBatchId(batch.getId());
            r.setTemplateId(templateId);
            r.setFormat(fmt);
            r.setCreateTime(LocalDateTime.now());
            try {
                Map<String, Object> merged = mergeWithSamples(t, data);
                byte[] body = renderOneBytes(t, merged, fmt, quality);
                String mime = mimeOf(fmt);
                String ext = extOf(fmt);
                String name = pickRecipient(merged);
                String certNo = pickCertNo(merged);
                String fileName = (name == null || name.isBlank() ? "证书_" + idx : name) + "." + ext;

                r.setRecipient(name);
                r.setCertNo(certNo);
                r.setDataJson(toJson(merged));
                r.setFileName(fileName);
                r.setMime(mime);
                r.setFileBase64(Base64.getEncoder().encodeToString(body));
                r.setStatus("SUCCESS");
                success++;
            } catch (Exception e) {
                log.warn("渲染失败 idx={}", idx, e);
                r.setStatus("FAILED");
                r.setErrorMsg(e.getMessage());
                r.setDataJson(toJson(data));
            }
            recordMapper.insert(r);
            idx++;
        }

        batch.setSuccessCount(success);
        batch.setStatus(success == dataList.size() ? "COMPLETED"
                : (success == 0 ? "FAILED" : "PARTIAL"));
        batch.setUpdateTime(LocalDateTime.now());
        batchMapper.updateById(batch);
        return batch;
    }

    /* ========================= 批次 CRUD ========================= */

    public IPage<CertificateIssueBatch> pageBatch(int pageNo, int pageSize,
                                                  String keyword, String templateId) {
        Page<CertificateIssueBatch> p = new Page<>(pageNo, pageSize);
        LambdaQueryWrapper<CertificateIssueBatch> w = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            w.like(CertificateIssueBatch::getBatchName, keyword)
                    .or().like(CertificateIssueBatch::getTemplateName, keyword);
        }
        if (templateId != null && !templateId.isBlank()) {
            w.eq(CertificateIssueBatch::getTemplateId, templateId);
        }
        w.orderByDesc(CertificateIssueBatch::getCreateTime);
        return batchMapper.selectPage(p, w);
    }

    public CertificateIssueBatch getBatch(String id) {
        return batchMapper.selectById(id);
    }

    @Transactional
    public CertificateIssueBatch updateBatch(String id, String batchName, String remark) {
        CertificateIssueBatch b = batchMapper.selectById(id);
        if (b == null) throw new IllegalArgumentException("批次不存在");
        if (batchName != null) b.setBatchName(batchName);
        if (remark != null) b.setRemark(remark);
        b.setUpdateTime(LocalDateTime.now());
        batchMapper.updateById(b);
        return b;
    }

    /** 删除批次（连同明细一起逻辑删除） */
    @Transactional
    public void removeBatch(String id) {
        batchMapper.deleteById(id);
        LambdaQueryWrapper<CertificateIssueRecord> w = new LambdaQueryWrapper<>();
        w.eq(CertificateIssueRecord::getBatchId, id);
        recordMapper.delete(w);
    }

    /* ========================= 明细 CRUD ========================= */

    public IPage<CertificateIssueRecord> pageRecord(String batchId, int pageNo, int pageSize,
                                                    String keyword, String status) {
        Page<CertificateIssueRecord> p = new Page<>(pageNo, pageSize);
        LambdaQueryWrapper<CertificateIssueRecord> w = new LambdaQueryWrapper<>();
        if (batchId != null && !batchId.isBlank()) {
            w.eq(CertificateIssueRecord::getBatchId, batchId);
        }
        if (keyword != null && !keyword.isBlank()) {
            w.and(qw -> qw.like(CertificateIssueRecord::getRecipient, keyword)
                    .or().like(CertificateIssueRecord::getCertNo, keyword)
                    .or().like(CertificateIssueRecord::getFileName, keyword));
        }
        if (status != null && !status.isBlank()) {
            w.eq(CertificateIssueRecord::getStatus, status);
        }
        w.orderByAsc(CertificateIssueRecord::getCreateTime);
        return recordMapper.selectPage(p, w);
    }

    public CertificateIssueRecord getRecord(String id) {
        return recordMapper.selectById(id);
    }

    /** 重新渲染指定明细（更新 fileBase64） */
    @Transactional
    public CertificateIssueRecord rerender(String id) {
        CertificateIssueRecord r = recordMapper.selectById(id);
        if (r == null) throw new IllegalArgumentException("明细不存在");
        CertificateTemplate t = templateService.getEntity(r.getTemplateId());
        if (t == null) throw new IllegalArgumentException("模版不存在");
        try {
            Map<String, Object> data = parseData(r.getDataJson());
            byte[] body = renderOneBytes(t, mergeWithSamples(t, data), r.getFormat(), null);
            r.setFileBase64(Base64.getEncoder().encodeToString(body));
            r.setStatus("SUCCESS");
            r.setErrorMsg(null);
        } catch (Exception e) {
            r.setStatus("FAILED");
            r.setErrorMsg(e.getMessage());
        }
        recordMapper.updateById(r);
        return r;
    }

    @Transactional
    public void removeRecord(String id) {
        CertificateIssueRecord r = recordMapper.selectById(id);
        if (r == null) return;
        recordMapper.deleteById(id);
        // 同步更新批次成功计数
        CertificateIssueBatch b = batchMapper.selectById(r.getBatchId());
        if (b != null) {
            LambdaQueryWrapper<CertificateIssueRecord> w = new LambdaQueryWrapper<>();
            w.eq(CertificateIssueRecord::getBatchId, b.getId())
                    .eq(CertificateIssueRecord::getStatus, "SUCCESS");
            Long cnt = recordMapper.selectCount(w);
            b.setSuccessCount(cnt == null ? 0 : cnt.intValue());
            LambdaQueryWrapper<CertificateIssueRecord> wAll = new LambdaQueryWrapper<>();
            wAll.eq(CertificateIssueRecord::getBatchId, b.getId());
            Long total = recordMapper.selectCount(wAll);
            b.setTotalCount(total == null ? 0 : total.intValue());
            b.setUpdateTime(LocalDateTime.now());
            batchMapper.updateById(b);
        }
    }

    /** 取明细的二进制证书（解 base64） */
    public byte[] decodeRecordBytes(CertificateIssueRecord r) {
        if (r == null || r.getFileBase64() == null) return null;
        return Base64.getDecoder().decode(r.getFileBase64());
    }

    /* ========================= 工具方法 ========================= */

    private byte[] renderOneBytes(CertificateTemplate t, Map<String, Object> data,
                                  String fmt, Float quality) throws IOException {
        if ("pdf".equals(fmt)) {
            byte[] png = renderService.renderToFormat(t, data, "png", null);
            return pdfService.toPdf(png,
                    t.getWidth() == null ? 1123 : t.getWidth(),
                    t.getHeight() == null ? 794 : t.getHeight());
        }
        return renderService.renderToFormat(t, data, fmt, quality);
    }

    private Map<String, Object> mergeWithSamples(CertificateTemplate t, Map<String, Object> data) {
        Map<String, Object> merged = new HashMap<>(templateService.getFieldSamples(t));
        if (data != null) merged.putAll(data);
        return merged;
    }

    private String buildBatchName(String name, String tplName) {
        if (name != null && !name.isBlank()) return name;
        return (tplName == null ? "证书发放" : tplName) + "-"
                + LocalDateTime.now().toString().replace("T", " ").substring(0, 19);
    }

    private String pickRecipient(Map<String, Object> data) {
        if (data == null) return null;
        for (String k : RECIPIENT_KEYS) {
            Object v = data.get(k);
            if (v != null && !String.valueOf(v).isBlank()) return String.valueOf(v);
        }
        return null;
    }

    private String pickCertNo(Map<String, Object> data) {
        if (data == null) return null;
        for (String k : CERT_NO_KEYS) {
            Object v = data.get(k);
            if (v != null && !String.valueOf(v).isBlank()) return String.valueOf(v);
        }
        return null;
    }

    private String mimeOf(String fmt) {
        if ("pdf".equals(fmt)) return "application/pdf";
        if ("jpg".equals(fmt) || "jpeg".equals(fmt)) return "image/jpeg";
        return "image/png";
    }

    private String extOf(String fmt) {
        if ("pdf".equals(fmt)) return "pdf";
        if ("jpg".equals(fmt) || "jpeg".equals(fmt)) return "jpg";
        return "png";
    }

    private String toJson(Object v) {
        try {
            return om.writeValueAsString(v);
        } catch (Exception e) {
            return "{}";
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseData(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return om.readValue(json, Map.class);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}
