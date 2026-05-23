package com.guoren.workflow.controller;

import com.guoren.workflow.dto.ApprovalDTO;
import com.guoren.workflow.dto.LeaveRequestDTO;
import com.guoren.workflow.entity.LeaveDraft;
import com.guoren.workflow.entity.LeaveRequest;
import com.guoren.workflow.service.LeaveDraftService;
import com.guoren.workflow.service.LeaveWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 请假流程控制器
 */
@RestController
@RequestMapping("/api/workflow/leave")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LeaveWorkflowController {

    private final LeaveWorkflowService leaveWorkflowService;
    private final LeaveDraftService leaveDraftService;

    @PostMapping("/submit")
    public ResponseEntity<LeaveRequest> submitLeaveRequest(@RequestBody LeaveRequestDTO dto) {
        LeaveRequest result = leaveWorkflowService.submitLeaveRequest(dto);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<LeaveRequest>> getPendingTasks(@RequestParam String assignee) {
        List<LeaveRequest> tasks = leaveWorkflowService.getPendingTasks(assignee);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/approve")
    public ResponseEntity<LeaveRequest> approveTask(@RequestBody ApprovalDTO dto) {
        LeaveRequest result = leaveWorkflowService.approveTask(dto);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<LeaveRequest>> getMyLeaveRequests(@RequestParam String applicant) {
        List<LeaveRequest> requests = leaveWorkflowService.getMyLeaveRequests(applicant);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/detail/{processInstanceId}")
    public ResponseEntity<LeaveRequest> getLeaveDetail(@PathVariable String processInstanceId) {
        LeaveRequest detail = leaveWorkflowService.getLeaveRequestByProcessInstanceId(processInstanceId);
        if (detail == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detail);
    }

    /** 流程历史轨迹 */
    @GetMapping("/process-history/{processInstanceId}")
    public ResponseEntity<Map<String, Object>> getProcessHistory(@PathVariable String processInstanceId) {
        Map<String, Object> history = leaveWorkflowService.getProcessHistory(processInstanceId);
        if (history == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(history);
    }

    /** 流程图数据（XML + 节点状态） */
    @GetMapping("/process-diagram/{processInstanceId}")
    public ResponseEntity<Map<String, Object>> getProcessDiagram(@PathVariable String processInstanceId) {
        Map<String, Object> diagram = leaveWorkflowService.getProcessDiagram(processInstanceId);
        if (diagram == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(diagram);
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, String>>> getUsers() {
        // 与系统人员/部门/角色/岗位管理模块 mock 保持一致
        List<Map<String, String>> users = List.of(
                Map.of("id", "zhangsan", "name", "张三", "dept", "前端组", "role", "普通用户", "position", "前端工程师", "group", ""),
                Map.of("id", "lisi", "name", "李四", "dept", "人事部", "role", "部门经理", "position", "HR经理", "group", "hr"),
                Map.of("id", "wangwu", "name", "王五", "dept", "财务部", "role", "普通用户", "position", "会计", "group", ""),
                Map.of("id", "zhaoliu", "name", "赵六", "dept", "后端组", "role", "管理员", "position", "后端工程师", "group", ""),
                Map.of("id", "sunqi", "name", "孙七", "dept", "市场部", "role", "普通用户", "position", "市场专员", "group", ""),
                Map.of("id", "zhouba", "name", "周八", "dept", "产品部", "role", "部门经理", "position", "产品经理", "group", "managers")
        );
        return ResponseEntity.ok(users);
    }

    // ============ 请假草稿 CRUD ============

    /** 创建请假草稿 */
    @PostMapping("/draft")
    public ResponseEntity<LeaveDraft> createDraft(@RequestBody LeaveDraft draft) {
        return ResponseEntity.ok(leaveDraftService.create(draft));
    }

    /** 更新请假草稿 */
    @PutMapping("/draft/{id}")
    public ResponseEntity<LeaveDraft> updateDraft(@PathVariable String id, @RequestBody LeaveDraft draft) {
        return ResponseEntity.ok(leaveDraftService.update(id, draft));
    }

    /** 删除请假草稿 */
    @DeleteMapping("/draft/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable String id) {
        leaveDraftService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** 详情 */
    @GetMapping("/draft/{id}")
    public ResponseEntity<LeaveDraft> getDraft(@PathVariable String id) {
        LeaveDraft d = leaveDraftService.get(id);
        if (d == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(d);
    }

    /** 列表（applicant 为空则返回所有） */
    @GetMapping("/drafts")
    public ResponseEntity<List<LeaveDraft>> listDrafts(@RequestParam(required = false) String applicant) {
        return ResponseEntity.ok(leaveDraftService.list(applicant));
    }

    /** 提交草稿到流程 */
    @PostMapping("/draft/{id}/submit")
    public ResponseEntity<LeaveDraft> submitDraft(@PathVariable String id) {
        return ResponseEntity.ok(leaveDraftService.submitToProcess(id));
    }
}
