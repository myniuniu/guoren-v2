package com.guoren.workflow.dms.controller;

import com.guoren.workflow.dms.service.DmsTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * DMS 标签管理接口
 *
 * <pre>
 * GET /api/dms/tag/list?orderBy=usage   标签列表（支持 usage 倒序）
 * </pre>
 */
@RestController
@RequestMapping("/api/dms/tag")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DmsTagController {

    private final DmsTagService service;

    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> list(
            @RequestParam(value = "orderBy", required = false) String orderBy) {
        return ResponseEntity.ok(service.listAll(orderBy));
    }
}
