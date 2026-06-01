package com.guoren.workflow.dms.controller;

import com.guoren.workflow.dms.dto.DmsCategoryDTO;
import com.guoren.workflow.dms.entity.DmsCategory;
import com.guoren.workflow.dms.service.DmsCategoryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * DMS 分类树管理接口
 *
 * <pre>
 * GET    /api/dms/category/tree         分类树（含 docCount）
 * POST   /api/dms/category              新建分类
 * PUT    /api/dms/category/{id}         更新分类（重命名 / 排序）
 * POST   /api/dms/category/{id}/move    移动分类到新父节点
 * DELETE /api/dms/category/{id}         删除分类（含子分类无文档时方可）
 * </pre>
 */
@RestController
@RequestMapping("/api/dms/category")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DmsCategoryController {

    private final DmsCategoryService service;

    @GetMapping("/tree")
    public ResponseEntity<List<Map<String, Object>>> tree() {
        return ResponseEntity.ok(service.listTree());
    }

    @PostMapping
    public ResponseEntity<DmsCategory> create(@RequestBody DmsCategoryDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DmsCategory> update(@PathVariable String id,
                                              @RequestBody DmsCategoryDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PostMapping("/{id}/move")
    public ResponseEntity<DmsCategory> move(@PathVariable String id,
                                            @RequestBody MoveDTO dto) {
        return ResponseEntity.ok(service.move(id, dto.getParentId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable String id) {
        service.remove(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class MoveDTO {
        /** 新父节点 id，为空表示移到根 */
        private String parentId;
    }
}
