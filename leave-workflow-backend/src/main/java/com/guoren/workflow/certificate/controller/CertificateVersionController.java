package com.guoren.workflow.certificate.controller;

import com.guoren.workflow.certificate.entity.CertificateTemplate;
import com.guoren.workflow.certificate.service.CertificateTemplateService;
import com.guoren.workflow.certificate.service.CertificateVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 模版版本管理（D2）
 */
@RestController
@RequestMapping("/api/certificate/version")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CertificateVersionController {

    private final CertificateVersionService versionService;
    private final CertificateTemplateService templateService;

    /** 把当前模版打一个快照 */
    @PostMapping("/snapshot")
    public ResponseEntity<?> snapshot(@RequestBody Map<String, Object> body) {
        String templateId = String.valueOf(body.get("templateId"));
        String comment = body.get("comment") == null ? null : String.valueOf(body.get("comment"));
        CertificateTemplate t = templateService.getEntity(templateId);
        if (t == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(versionService.snapshot(t, comment));
    }

    /** 列出某模版所有版本 */
    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> list(@RequestParam String templateId) {
        return ResponseEntity.ok(versionService.list(templateId));
    }

    /** 取某版本详情，含 snapshot 内容 */
    @GetMapping("/detail")
    public ResponseEntity<Map<String, Object>> detail(@RequestParam String templateId,
                                                      @RequestParam Integer versionNo) {
        Map<String, Object> d = versionService.detail(templateId, versionNo);
        if (d == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(d);
    }

    /** 回滚到指定版本 */
    @PostMapping("/rollback")
    public ResponseEntity<CertificateTemplate> rollback(@RequestBody Map<String, Object> body) {
        String templateId = String.valueOf(body.get("templateId"));
        Integer versionNo = ((Number) body.get("versionNo")).intValue();
        return ResponseEntity.ok(versionService.rollback(templateId, versionNo));
    }
}
