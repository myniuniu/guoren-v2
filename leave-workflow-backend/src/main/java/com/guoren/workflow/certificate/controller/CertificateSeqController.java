package com.guoren.workflow.certificate.controller;

import com.guoren.workflow.certificate.entity.CertificateSeq;
import com.guoren.workflow.certificate.service.CertificateSeqService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 证书编号规则管理（E4）
 */
@RestController
@RequestMapping("/api/certificate/seq")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CertificateSeqController {

    private final CertificateSeqService seqService;

    @GetMapping("/list")
    public ResponseEntity<List<CertificateSeq>> list() {
        return ResponseEntity.ok(seqService.list());
    }

    /** 新增/更新规则 */
    @PostMapping("/save")
    public ResponseEntity<CertificateSeq> save(@RequestBody Map<String, Object> body) {
        String ruleKey = String.valueOf(body.get("ruleKey"));
        String rulePattern = body.get("rulePattern") == null ? null : String.valueOf(body.get("rulePattern"));
        return ResponseEntity.ok(seqService.save(ruleKey, rulePattern));
    }

    /** 取下一个编号（会落库递增） */
    @PostMapping("/next")
    public ResponseEntity<Map<String, Object>> next(@RequestBody Map<String, Object> body) {
        String ruleKey = String.valueOf(body.get("ruleKey"));
        String value = seqService.next(ruleKey);
        return ResponseEntity.ok(Map.of("value", value));
    }

    /** 仅预览下一个编号（不落库） */
    @GetMapping("/peek")
    public ResponseEntity<Map<String, Object>> peek(@RequestParam String ruleKey) {
        return ResponseEntity.ok(Map.of("value", seqService.peek(ruleKey)));
    }

    /** 取单条规则详情 */
    @GetMapping("/{ruleKey}")
    public ResponseEntity<CertificateSeq> get(@PathVariable String ruleKey) {
        CertificateSeq r = seqService.get(ruleKey);
        return r == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(r);
    }

    /** 删除规则 */
    @DeleteMapping("/{ruleKey}")
    public ResponseEntity<Void> delete(@PathVariable String ruleKey) {
        seqService.delete(ruleKey);
        return ResponseEntity.ok().build();
    }

    /** 重置流水号 */
    @PostMapping("/reset")
    public ResponseEntity<CertificateSeq> reset(@RequestBody Map<String, Object> body) {
        String ruleKey = String.valueOf(body.get("ruleKey"));
        Object cs = body.get("currentSeq");
        Long currentSeq = cs == null ? 0L : Long.valueOf(String.valueOf(cs));
        return ResponseEntity.ok(seqService.reset(ruleKey, currentSeq));
    }
}
