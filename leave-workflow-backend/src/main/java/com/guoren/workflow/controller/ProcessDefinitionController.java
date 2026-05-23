package com.guoren.workflow.controller;

import com.guoren.workflow.dto.DeployRequestDTO;
import com.guoren.workflow.entity.ProcessDefinitionVO;
import com.guoren.workflow.service.ProcessDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 流程定义管理控制器
 */
@RestController
@RequestMapping("/api/workflow/process")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProcessDefinitionController {

    private final ProcessDefinitionService processDefinitionService;

    /**
     * 获取流程定义列表
     */
    @GetMapping("/list")
    public ResponseEntity<List<ProcessDefinitionVO>> listProcessDefinitions() {
        List<ProcessDefinitionVO> list = processDefinitionService.listProcessDefinitions();
        return ResponseEntity.ok(list);
    }

    /**
     * 根据流程key获取最新版本流程定义
     */
    @GetMapping("/key/{processKey}")
    public ResponseEntity<ProcessDefinitionVO> getProcessByKey(@PathVariable String processKey) {
        ProcessDefinitionVO vo = processDefinitionService.getProcessByKey(processKey);
        return ResponseEntity.ok(vo);
    }

    /**
     * 获取流程XML
     */
    @GetMapping("/xml/{deploymentId}")
    public ResponseEntity<String> getProcessXml(@PathVariable String deploymentId) {
        String xml = processDefinitionService.getProcessXml(deploymentId);
        return ResponseEntity.ok(xml);
    }

    /**
     * 部署流程定义
     */
    @PostMapping("/deploy")
    public ResponseEntity<ProcessDefinitionVO> deployProcess(@RequestBody DeployRequestDTO dto) {
        ProcessDefinitionVO result = processDefinitionService.deployProcess(dto);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除流程定义
     */
    @DeleteMapping("/{deploymentId}")
    public ResponseEntity<Void> deleteProcess(@PathVariable String deploymentId) {
        processDefinitionService.deleteProcess(deploymentId);
        return ResponseEntity.ok().build();
    }
}
