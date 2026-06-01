package com.guoren.workflow.dms.service;

import com.guoren.workflow.dms.entity.DmsDocument;
import com.guoren.workflow.dto.ApprovalDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.HistoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.history.HistoricProcessInstance;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.engine.task.Comment;
import org.flowable.task.api.Task;
import org.flowable.task.api.history.HistoricTaskInstance;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * DMS 文档审批流程服务（dmsReviewProcess）
 *
 * <p>提交：startProcessInstanceByKey + 自动 complete 第一个填写任务，主表写回 PENDING / processInstanceId。
 * <p>审批：taskService.complete，结束时根据 endActivityId 写回 PUBLISHED / REJECTED。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DmsWorkflowService {

    public static final String PROCESS_KEY = "dmsReviewProcess";

    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final HistoryService historyService;
    private final DmsDocumentService documentService;

    /**
     * 提交文档审批
     */
    @Transactional
    public DmsDocument submit(String docId, String applicant) {
        DmsDocument doc = documentService.getById(docId);
        if (doc == null) {
            throw new IllegalArgumentException("文档不存在: " + docId);
        }
        if ("PENDING".equals(doc.getStatus())) {
            throw new IllegalStateException("文档已在审批中");
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("docId", docId);
        variables.put("docTitle", doc.getTitle());
        variables.put("applicant", applicant);
        variables.put("approved", false);

        ProcessInstance instance = runtimeService.startProcessInstanceByKey(PROCESS_KEY, variables);
        log.info("启动 DMS 审批流程, processInstanceId={}", instance.getId());

        // 自动 complete 第一个「填写文档信息」任务（assignee=applicant）
        Task submitTask = taskService.createTaskQuery()
                .processInstanceId(instance.getId())
                .singleResult();
        if (submitTask != null) {
            taskService.complete(submitTask.getId());
        }

        return documentService.updateStatus(docId, "PENDING", instance.getId());
    }

    /**
     * 审批
     */
    @Transactional
    public DmsDocument approve(ApprovalDTO dto) {
        Task task = taskService.createTaskQuery().taskId(dto.getTaskId()).singleResult();
        if (task == null) {
            throw new IllegalArgumentException("任务不存在或已完成");
        }
        String pid = task.getProcessInstanceId();

        if (task.getAssignee() == null) {
            taskService.claim(dto.getTaskId(), dto.getApprover());
        }
        if (dto.getComment() != null && !dto.getComment().isBlank()) {
            taskService.addComment(dto.getTaskId(), pid, dto.getComment());
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("approved", Boolean.TRUE.equals(dto.getApproved()));
        taskService.complete(dto.getTaskId(), vars);

        // 找到对应文档（通过流程变量 docId）
        ProcessInstance running = runtimeService.createProcessInstanceQuery()
                .processInstanceId(pid).singleResult();
        String docId;
        if (running != null) {
            Object v = runtimeService.getVariable(pid, "docId");
            docId = v == null ? null : v.toString();
        } else {
            docId = lookupDocIdFromHistory(pid);
        }

        if (docId == null) {
            log.warn("未能根据流程实例 {} 还原 docId", pid);
            return null;
        }

        // 流程是否已结束 -> 决定状态
        HistoricProcessInstance hi = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(pid).singleResult();
        String newStatus = "PENDING";
        if (hi != null && hi.getEndTime() != null) {
            if ("endApproved".equals(hi.getEndActivityId())) newStatus = "PUBLISHED";
            else if ("endRejected".equals(hi.getEndActivityId())) newStatus = "REJECTED";
            else newStatus = "PUBLISHED";
        }
        return documentService.updateStatus(docId, newStatus, pid);
    }

    private String lookupDocIdFromHistory(String pid) {
        HistoricProcessInstance hi = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(pid).includeProcessVariables().singleResult();
        if (hi == null || hi.getProcessVariables() == null) return null;
        Object v = hi.getProcessVariables().get("docId");
        return v == null ? null : v.toString();
    }

    /**
     * 待办列表（候选组 + 个人 + 候选用户三路合并）
     */
    public List<Map<String, Object>> getPendingTasks(String assignee) {
        if (assignee == null || assignee.isBlank()) return new ArrayList<>();

        List<Task> groupTasks = taskService.createTaskQuery()
                .processDefinitionKey(PROCESS_KEY)
                .taskCandidateGroup(assignee).list();
        List<Task> personalTasks = taskService.createTaskQuery()
                .processDefinitionKey(PROCESS_KEY)
                .taskAssignee(assignee).list();
        List<Task> candidateUserTasks = taskService.createTaskQuery()
                .processDefinitionKey(PROCESS_KEY)
                .taskCandidateUser(assignee).list();

        Map<String, Task> merged = new LinkedHashMap<>();
        for (Task t : groupTasks) merged.put(t.getId(), t);
        for (Task t : personalTasks) merged.put(t.getId(), t);
        for (Task t : candidateUserTasks) merged.put(t.getId(), t);

        List<Map<String, Object>> ret = new ArrayList<>();
        for (Task t : merged.values()) {
            Map<String, Object> vars = runtimeService.getVariables(t.getProcessInstanceId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("taskId", t.getId());
            m.put("taskName", t.getName());
            m.put("processInstanceId", t.getProcessInstanceId());
            m.put("createTime", t.getCreateTime());
            m.put("docId", vars.get("docId"));
            m.put("docTitle", vars.get("docTitle"));
            m.put("applicant", vars.get("applicant"));
            // 富化文档主信息
            String docId = (String) vars.get("docId");
            if (docId != null) {
                DmsDocument doc = documentService.getById(docId);
                if (doc != null) {
                    m.put("docNo", doc.getDocNo());
                    m.put("docType", doc.getDocType());
                    m.put("status", doc.getStatus());
                }
            }
            ret.add(m);
        }
        return ret;
    }

    /**
     * 文档审批历史轨迹（按 docId 反查 processInstanceId）
     */
    public Map<String, Object> getHistoryByDoc(String docId) {
        DmsDocument doc = documentService.getById(docId);
        if (doc == null || doc.getProcessInstanceId() == null) {
            return null;
        }
        return getHistoryByPid(doc.getProcessInstanceId());
    }

    public Map<String, Object> getHistoryByPid(String processInstanceId) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        HistoricProcessInstance hi = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .includeProcessVariables()
                .singleResult();
        if (hi == null) return null;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("processInstanceId", processInstanceId);
        if (hi.getProcessVariables() != null) {
            result.put("applicant", hi.getProcessVariables().get("applicant"));
            result.put("docId", hi.getProcessVariables().get("docId"));
            result.put("docTitle", hi.getProcessVariables().get("docTitle"));
        }
        if (hi.getStartTime() != null) {
            result.put("startTime", fmt.format(hi.getStartTime().toInstant().atZone(ZoneId.systemDefault())));
        }
        if (hi.getEndTime() != null) {
            result.put("endTime", fmt.format(hi.getEndTime().toInstant().atZone(ZoneId.systemDefault())));
        }

        String currentStatus;
        if (hi.getEndActivityId() != null) {
            if ("endApproved".equals(hi.getEndActivityId())) currentStatus = "已通过";
            else if ("endRejected".equals(hi.getEndActivityId())) currentStatus = "已拒绝";
            else currentStatus = "已结束";
        } else {
            Task t = taskService.createTaskQuery()
                    .processInstanceId(processInstanceId).singleResult();
            currentStatus = t != null ? t.getName() : "处理中";
        }
        result.put("currentStatus", currentStatus);

        // 评论
        List<Comment> allComments = taskService.getProcessInstanceComments(processInstanceId);
        Map<String, String> commentMap = new HashMap<>();
        for (Comment c : allComments) {
            if (c.getTaskId() != null) {
                commentMap.merge(c.getTaskId(), c.getFullMessage(), (a, b) -> a + "\n" + b);
            }
        }

        // 历史任务
        List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
                .processInstanceId(processInstanceId)
                .orderByHistoricTaskInstanceStartTime().asc().list();

        List<Map<String, Object>> logs = new ArrayList<>();
        Object applicant = hi.getProcessVariables() != null ? hi.getProcessVariables().get("applicant") : null;

        Map<String, Object> startLog = new LinkedHashMap<>();
        startLog.put("nodeName", "发起人");
        startLog.put("assignee", applicant != null ? applicant : "-");
        startLog.put("action", "提交");
        startLog.put("actionType", "submit");
        startLog.put("completed", true);
        startLog.put("time", hi.getStartTime() != null
                ? fmt.format(hi.getStartTime().toInstant().atZone(ZoneId.systemDefault())) : null);
        logs.add(startLog);

        for (HistoricTaskInstance t : tasks) {
            if ("填写文档信息".equals(t.getName())) continue;
            Map<String, Object> log = new LinkedHashMap<>();
            log.put("nodeName", t.getName());
            log.put("assignee", t.getAssignee() != null ? t.getAssignee() : "");
            boolean completed = t.getEndTime() != null;
            log.put("completed", completed);
            String action;
            String actionType;
            if (completed) {
                if ("已拒绝".equals(currentStatus) && tasks.indexOf(t) == tasks.size() - 1) {
                    action = "拒绝"; actionType = "reject";
                } else {
                    action = "通过"; actionType = "approve";
                }
                log.put("time", t.getEndTime() != null
                        ? fmt.format(t.getEndTime().toInstant().atZone(ZoneId.systemDefault())) : null);
            } else {
                action = "处理中"; actionType = "pending";
                log.put("time", null);
            }
            log.put("action", action);
            log.put("actionType", actionType);
            log.put("comment", commentMap.get(t.getId()));
            logs.add(log);
        }
        if (hi.getEndTime() == null) {
            Map<String, Object> tail = new LinkedHashMap<>();
            tail.put("nodeName", "处理中");
            tail.put("actionType", "pending");
            tail.put("completed", false);
            tail.put("placeholder", true);
            logs.add(tail);
        }
        result.put("logs", logs);

        // 评论列表
        List<Map<String, Object>> commentList = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (Comment c : allComments) {
            if (!seen.add(c.getId())) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("author", c.getUserId());
            m.put("content", c.getFullMessage());
            m.put("time", c.getTime() != null
                    ? fmt.format(c.getTime().toInstant().atZone(ZoneId.systemDefault())) : null);
            commentList.add(m);
        }
        result.put("comments", commentList);
        return result;
    }
}
