package com.guoren.workflow.solution.controller;

import com.guoren.workflow.solution.dto.TenantDTO;
import com.guoren.workflow.solution.entity.Tenant;
import com.guoren.workflow.solution.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 租户管理接口
 */
@RestController
@RequestMapping("/api/tenant")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping("/list")
    public ResponseEntity<List<Tenant>> list(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(tenantService.list(keyword, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tenant> detail(@PathVariable String id) {
        return ResponseEntity.ok(tenantService.detail(id));
    }

    @PostMapping
    public ResponseEntity<Tenant> create(@RequestBody TenantDTO dto) {
        return ResponseEntity.ok(tenantService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tenant> update(@PathVariable String id, @RequestBody TenantDTO dto) {
        return ResponseEntity.ok(tenantService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable String id) {
        tenantService.remove(id);
        return ResponseEntity.noContent().build();
    }
}
