package com.guoren.workflow.controller;

import com.guoren.workflow.dto.ProcessConfigPublishDTO;
import com.guoren.workflow.dto.ProcessConfigSaveDTO;
import com.guoren.workflow.dto.ProcessConfigVO;
import com.guoren.workflow.entity.ProcessConfigVersion;
import com.guoren.workflow.service.ProcessConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 流程配置管理控制器（流程设计 V2 配套）
 *
 * 与 ProcessDefinitionController 的区别：
 * - ProcessDefinitionController 管理 Flowable 原生的流程定义（部署/查询 BPMN）
 * - ProcessConfigController 管理流程设计 V2 的配置数据（表单 schema、流程 JSON、权限、版本）
 * 两者通过 processKey 和 deploymentId 关联
 */
@Slf4j
@RestController
@RequestMapping("/api/workflow/process-config")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProcessConfigController {

    private final ProcessConfigService processConfigService;

    /**
     * 获取所有流程配置列表
     */
    @GetMapping("/list")
    public ResponseEntity<List<ProcessConfigVO>> listAll() {
        return ResponseEntity.ok(processConfigService.listAll());
    }

    /**
     * 根据 processKey 获取最新配置（草稿）
     */
    @GetMapping("/key/{processKey}")
    public ResponseEntity<ProcessConfigVO> getByKey(@PathVariable String processKey) {
        ProcessConfigVO vo = processConfigService.getByKey(processKey);
        if (vo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(vo);
    }

    /**
     * 获取指定版本的配置快照
     */
    @GetMapping("/key/{processKey}/version/{version}")
    public ResponseEntity<ProcessConfigVO> getVersion(
            @PathVariable String processKey,
            @PathVariable Integer version) {
        ProcessConfigVO vo = processConfigService.getVersion(processKey, version);
        if (vo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(vo);
    }

    /**
     * 获取流程配置的所有版本列表
     */
    @GetMapping("/key/{processKey}/versions")
    public ResponseEntity<List<ProcessConfigVersion>> listVersions(@PathVariable String processKey) {
        return ResponseEntity.ok(processConfigService.listVersions(processKey));
    }

    /**
     * 保存草稿（创建或更新）
     */
    @PostMapping("/save")
    public ResponseEntity<ProcessConfigVO> saveDraft(@RequestBody ProcessConfigSaveDTO dto) {
        return ResponseEntity.ok(processConfigService.saveDraft(dto));
    }

    /**
     * 发布流程配置（生成版本快照 + 部署 BPMN 到 Flowable）
     */
    @PostMapping("/publish")
    public ResponseEntity<ProcessConfigVO> publish(@RequestBody ProcessConfigPublishDTO dto) {
        return ResponseEntity.ok(processConfigService.publish(dto));
    }

    /**
     * 回滚草稿到指定版本快照（覆盖主表的 schema / flow / settings，状态重置为 DRAFT）
     */
    @PostMapping("/key/{processKey}/rollback/{version}")
    public ResponseEntity<ProcessConfigVO> rollback(
            @PathVariable String processKey,
            @PathVariable Integer version) {
        return ResponseEntity.ok(processConfigService.rollbackToVersion(processKey, version));
    }

    /**
     * 删除流程配置（逻辑删除）
     */
    @DeleteMapping("/key/{processKey}")
    public ResponseEntity<Void> deleteByKey(@PathVariable String processKey) {
        processConfigService.deleteByKey(processKey);
        return ResponseEntity.ok().build();
    }
}
