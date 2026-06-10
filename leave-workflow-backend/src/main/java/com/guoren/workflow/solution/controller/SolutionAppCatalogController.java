package com.guoren.workflow.solution.controller;

import com.guoren.workflow.solution.dto.AppCatalogDTO;
import com.guoren.workflow.solution.entity.AppCatalog;
import com.guoren.workflow.solution.service.AppCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 方案应用目录接口
 */
@RestController
@RequestMapping("/api/solution/apps")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SolutionAppCatalogController {

    private final AppCatalogService appCatalogService;

    @GetMapping
    public ResponseEntity<List<AppCatalog>> list(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(appCatalogService.list(keyword, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppCatalog> detail(@PathVariable String id) {
        return ResponseEntity.ok(appCatalogService.detail(id));
    }

    @PostMapping
    public ResponseEntity<AppCatalog> create(@RequestBody AppCatalogDTO dto) {
        return ResponseEntity.ok(appCatalogService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppCatalog> update(@PathVariable String id, @RequestBody AppCatalogDTO dto) {
        return ResponseEntity.ok(appCatalogService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable String id) {
        appCatalogService.remove(id);
        return ResponseEntity.noContent().build();
    }
}
