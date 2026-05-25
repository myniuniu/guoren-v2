package com.guoren.workflow.certificate.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.guoren.workflow.certificate.entity.CertificateIssueBatch;
import com.guoren.workflow.certificate.entity.CertificateIssueRecord;
import com.guoren.workflow.certificate.service.CertificateIssueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 证书发放（批次 + 明细）CRUD 接口（v1.2）
 *
 * 路径前缀：/api/certificate/issue
 */
@Slf4j
@RestController
@RequestMapping("/api/certificate/issue")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CertificateIssueController {

    private final CertificateIssueService issueService;

    /* ========================= 批次 ========================= */

    /** 创建批次：把一次发放（单/批量）落库 */
    @PostMapping("/batch/create")
    @SuppressWarnings("unchecked")
    public ResponseEntity<CertificateIssueBatch> createBatch(@RequestBody Map<String, Object> body) {
        String templateId = String.valueOf(body.get("templateId"));
        String batchName = body.get("batchName") == null ? null : String.valueOf(body.get("batchName"));
        String remark = body.get("remark") == null ? null : String.valueOf(body.get("remark"));
        String format = body.get("format") == null ? "png" : String.valueOf(body.get("format"));
        Float quality = body.get("quality") == null ? null : ((Number) body.get("quality")).floatValue();
        String createBy = body.get("createBy") == null ? "system" : String.valueOf(body.get("createBy"));

        List<Map<String, Object>> dataList;
        Object dl = body.get("dataList");
        if (dl instanceof List<?>) {
            dataList = (List<Map<String, Object>>) dl;
        } else {
            Object data = body.get("data");
            if (data instanceof Map<?, ?>) {
                dataList = List.of((Map<String, Object>) data);
            } else {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(issueService.createBatch(
                templateId, batchName, remark, format, quality, dataList, createBy));
    }

    /** 批次分页列表 */
    @GetMapping("/batch/page")
    public ResponseEntity<Map<String, Object>> pageBatch(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String templateId) {
        IPage<CertificateIssueBatch> p = issueService.pageBatch(pageNo, pageSize, keyword, templateId);
        Map<String, Object> r = new HashMap<>();
        r.put("records", p.getRecords());
        r.put("total", p.getTotal());
        r.put("pageNo", pageNo);
        r.put("pageSize", pageSize);
        return ResponseEntity.ok(r);
    }

    /** 批次详情 */
    @GetMapping("/batch/{id}")
    public ResponseEntity<CertificateIssueBatch> getBatch(@PathVariable String id) {
        CertificateIssueBatch b = issueService.getBatch(id);
        if (b == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(b);
    }

    /** 修改批次（仅 batchName / remark） */
    @PutMapping("/batch/{id}")
    public ResponseEntity<CertificateIssueBatch> updateBatch(@PathVariable String id,
                                                             @RequestBody Map<String, Object> body) {
        String name = body.get("batchName") == null ? null : String.valueOf(body.get("batchName"));
        String remark = body.get("remark") == null ? null : String.valueOf(body.get("remark"));
        return ResponseEntity.ok(issueService.updateBatch(id, name, remark));
    }

    /** 删除批次（连同明细） */
    @DeleteMapping("/batch/{id}")
    public ResponseEntity<Void> removeBatch(@PathVariable String id) {
        issueService.removeBatch(id);
        return ResponseEntity.ok().build();
    }

    /* ========================= 明细 ========================= */

    /** 明细分页列表（必传 batchId） */
    @GetMapping("/record/page")
    public ResponseEntity<Map<String, Object>> pageRecord(
            @RequestParam String batchId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        IPage<CertificateIssueRecord> p = issueService.pageRecord(batchId, pageNo, pageSize, keyword, status);
        // 列表中不返回 fileBase64，避免回包过大
        List<CertificateIssueRecord> trimmed = p.getRecords().stream().map(r -> {
            CertificateIssueRecord c = new CertificateIssueRecord();
            c.setId(r.getId());
            c.setBatchId(r.getBatchId());
            c.setTemplateId(r.getTemplateId());
            c.setCertNo(r.getCertNo());
            c.setRecipient(r.getRecipient());
            c.setFileName(r.getFileName());
            c.setMime(r.getMime());
            c.setFormat(r.getFormat());
            c.setStatus(r.getStatus());
            c.setErrorMsg(r.getErrorMsg());
            c.setCreateTime(r.getCreateTime());
            return c;
        }).toList();
        Map<String, Object> r = new HashMap<>();
        r.put("records", trimmed);
        r.put("total", p.getTotal());
        r.put("pageNo", pageNo);
        r.put("pageSize", pageSize);
        return ResponseEntity.ok(r);
    }

    /** 明细详情（含 dataJson，但不含 fileBase64） */
    @GetMapping("/record/{id}")
    public ResponseEntity<CertificateIssueRecord> getRecord(@PathVariable String id) {
        CertificateIssueRecord r = issueService.getRecord(id);
        if (r == null) return ResponseEntity.notFound().build();
        // 同样去掉 fileBase64，前端单独通过 /record/{id}/file 拉取
        r.setFileBase64(null);
        return ResponseEntity.ok(r);
    }

    /** 下载/预览明细对应的证书文件 */
    @GetMapping("/record/{id}/file")
    public ResponseEntity<byte[]> getRecordFile(@PathVariable String id,
                                                @RequestParam(defaultValue = "inline") String disposition) {
        CertificateIssueRecord r = issueService.getRecord(id);
        if (r == null) return ResponseEntity.notFound().build();
        byte[] body = issueService.decodeRecordBytes(r);
        if (body == null) return ResponseEntity.notFound().build();

        HttpHeaders h = new HttpHeaders();
        String mime = r.getMime() == null ? "application/octet-stream" : r.getMime();
        h.setContentType(MediaType.parseMediaType(mime));
        String fileName = r.getFileName() == null ? "certificate" : r.getFileName();
        // 使用 RFC 5987 编码，避免中文文件名被 Tomcat 拒绝（仅允许 ASCII）
        org.springframework.http.ContentDisposition cd = org.springframework.http.ContentDisposition
                .builder("attachment".equalsIgnoreCase(disposition) ? "attachment" : "inline")
                .filename(fileName, java.nio.charset.StandardCharsets.UTF_8)
                .build();
        h.setContentDisposition(cd);
        return new ResponseEntity<>(body, h, 200);
    }

    /** 重新渲染明细（适用于失败补救或改了模版以后想重出） */
    @PostMapping("/record/{id}/rerender")
    public ResponseEntity<CertificateIssueRecord> rerender(@PathVariable String id) {
        CertificateIssueRecord r = issueService.rerender(id);
        r.setFileBase64(null);
        return ResponseEntity.ok(r);
    }

    /** 删除单条明细 */
    @DeleteMapping("/record/{id}")
    public ResponseEntity<Void> removeRecord(@PathVariable String id) {
        issueService.removeRecord(id);
        return ResponseEntity.ok().build();
    }
}
