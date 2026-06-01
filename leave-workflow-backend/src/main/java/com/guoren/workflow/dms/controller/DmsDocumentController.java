package com.guoren.workflow.dms.controller;

import com.guoren.workflow.dms.dto.DmsDocumentDTO;
import com.guoren.workflow.dms.dto.DmsDocumentQueryDTO;
import com.guoren.workflow.dms.entity.DmsDocument;
import com.guoren.workflow.dms.service.DmsDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * DMS 文档管理接口
 *
 * <pre>
 * POST   /api/dms/document                       创建
 * PUT    /api/dms/document/{id}                  更新
 * GET    /api/dms/document/{id}                  详情
 * GET    /api/dms/document/list                  分页列表
 * DELETE /api/dms/document/{id}                  软删除
 * POST   /api/dms/document/bulk-move             批量移动到分类
 * GET    /api/dms/document/{id}/versions         版本列表
 * POST   /api/dms/document/{id}/rollback/{verId} 回滚到指定版本
 * </pre>
 *
 * 文件上传复用通用接口 POST /api/file/upload?biz=dms。
 */
@Slf4j
@RestController
@RequestMapping("/api/dms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DmsDocumentController {

    private final DmsDocumentService service;

    @PostMapping("/document")
    public ResponseEntity<DmsDocument> create(@RequestBody DmsDocumentDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/document/{id}")
    public ResponseEntity<DmsDocument> update(@PathVariable String id,
                                              @RequestBody DmsDocumentDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @GetMapping("/document/{id}")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String id) {
        Map<String, Object> d = service.detail(id);
        if (d == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(d);
    }

    @GetMapping("/document/list")
    public ResponseEntity<Map<String, Object>> list(DmsDocumentQueryDTO query) {
        return ResponseEntity.ok(service.page(query));
    }

    @DeleteMapping("/document/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 批量移动文档到某分类（categoryId 为空串则表示移出到未分类/根）
     */
    @PostMapping("/document/bulk-move")
    public ResponseEntity<Map<String, Object>> bulkMove(@RequestBody BulkMoveDTO dto) {
        int count = service.bulkMove(dto.getIds(), dto.getCategoryId());
        return ResponseEntity.ok(Map.of("moved", count));
    }

    @GetMapping("/document/{id}/versions")
    public ResponseEntity<List<Map<String, Object>>> versions(@PathVariable String id) {
        return ResponseEntity.ok(service.listVersions(id));
    }

    @PostMapping("/document/{id}/rollback/{versionId}")
    public ResponseEntity<DmsDocument> rollback(@PathVariable String id,
                                                @PathVariable String versionId,
                                                @RequestParam(value = "operator", required = false) String operator) {
        return ResponseEntity.ok(service.rollback(id, versionId, operator));
    }

    @lombok.Data
    public static class BulkMoveDTO {
        private java.util.List<String> ids;
        private String categoryId;
    }
}
