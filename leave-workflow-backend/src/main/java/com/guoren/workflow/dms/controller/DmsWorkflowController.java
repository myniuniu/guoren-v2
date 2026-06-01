package com.guoren.workflow.dms.controller;

import com.guoren.workflow.dms.entity.DmsDocument;
import com.guoren.workflow.dms.service.DmsWorkflowService;
import com.guoren.workflow.dto.ApprovalDTO;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * DMS 文档审批接口
 *
 * <pre>
 * POST /api/dms/workflow/submit/{docId}    提交审批（body: {applicant}）
 * POST /api/dms/workflow/approve            审批通过/拒绝（body: ApprovalDTO）
 * GET  /api/dms/workflow/pending?assignee= 待办列表
 * GET  /api/dms/workflow/history/{docId}   文档审批历史
 * </pre>
 */
@RestController
@RequestMapping("/api/dms/workflow")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DmsWorkflowController {

    private final DmsWorkflowService service;

    @PostMapping("/submit/{docId}")
    public ResponseEntity<DmsDocument> submit(@PathVariable String docId,
                                              @RequestBody SubmitDTO body) {
        return ResponseEntity.ok(service.submit(docId, body.getApplicant()));
    }

    @PostMapping("/approve")
    public ResponseEntity<DmsDocument> approve(@RequestBody ApprovalDTO dto) {
        return ResponseEntity.ok(service.approve(dto));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> pending(
            @RequestParam("assignee") String assignee) {
        return ResponseEntity.ok(service.getPendingTasks(assignee));
    }

    @GetMapping("/history/{docId}")
    public ResponseEntity<Map<String, Object>> history(@PathVariable String docId) {
        Map<String, Object> r = service.getHistoryByDoc(docId);
        if (r == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(r);
    }

    @Data
    public static class SubmitDTO {
        private String applicant;
    }
}
