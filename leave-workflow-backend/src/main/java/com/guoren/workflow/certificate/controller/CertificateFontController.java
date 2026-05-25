package com.guoren.workflow.certificate.controller;

import com.guoren.workflow.certificate.service.CertificateFontService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 字体推荐 / 校验接口（C1/C2）
 */
@RestController
@RequestMapping("/api/certificate/font")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CertificateFontController {

    private final CertificateFontService fontService;

    /** 推荐字体列表，含可用性标记 */
    @GetMapping("/recommend")
    public ResponseEntity<List<Map<String, Object>>> recommend() {
        return ResponseEntity.ok(fontService.listRecommended());
    }

    /** 校验给定字体在服务端是否可用 */
    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> check(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> fonts = body == null ? null : (List<String>) body.get("fonts");
        return ResponseEntity.ok(fontService.check(fonts));
    }
}
