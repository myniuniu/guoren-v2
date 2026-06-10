package com.guoren.workflow.solution.controller;

import com.guoren.workflow.solution.dto.SolutionAppConfigDTO;
import com.guoren.workflow.solution.dto.SolutionAppDTO;
import com.guoren.workflow.solution.dto.SolutionDTO;
import com.guoren.workflow.solution.service.SolutionService;
import com.guoren.workflow.solution.vo.SolutionDetailVO;
import com.guoren.workflow.solution.vo.SolutionListItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 解决方案管理接口
 */
@RestController
@RequestMapping("/api/solution")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SolutionController {

    private final SolutionService solutionService;

    @GetMapping("/list")
    public ResponseEntity<List<SolutionListItemVO>> list(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "tenantId", required = false) String tenantId,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(solutionService.list(keyword, tenantId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolutionDetailVO> detail(@PathVariable String id) {
        return ResponseEntity.ok(solutionService.detail(id));
    }

    @PostMapping
    public ResponseEntity<SolutionDetailVO> create(@RequestBody SolutionDTO dto) {
        return ResponseEntity.ok(solutionService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SolutionDetailVO> update(@PathVariable String id, @RequestBody SolutionDTO dto) {
        return ResponseEntity.ok(solutionService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable String id) {
        solutionService.remove(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/apps")
    public ResponseEntity<SolutionDetailVO> updateApps(@PathVariable String id,
                                                       @RequestBody List<SolutionAppDTO> apps) {
        return ResponseEntity.ok(solutionService.updateApps(id, apps));
    }

    @PutMapping("/{id}/apps/{solutionAppId}/configs")
    public ResponseEntity<SolutionDetailVO> updateConfigs(@PathVariable String id,
                                                          @PathVariable String solutionAppId,
                                                          @RequestBody List<SolutionAppConfigDTO> configs) {
        return ResponseEntity.ok(solutionService.updateAppConfigs(id, solutionAppId, configs));
    }
}
