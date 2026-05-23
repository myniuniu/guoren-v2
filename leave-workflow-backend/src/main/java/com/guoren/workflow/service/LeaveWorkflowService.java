package com.guoren.workflow.service;

import com.guoren.workflow.dto.ApprovalDTO;
import com.guoren.workflow.dto.LeaveRequestDTO;
import com.guoren.workflow.entity.LeaveRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.*;
import org.flowable.engine.history.HistoricActivityInstance;
import org.flowable.engine.history.HistoricProcessInstance;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.engine.task.Comment;
import org.flowable.task.api.Task;
import org.flowable.task.api.history.HistoricTaskInstance;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 请假流程服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveWorkflowService {

    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final RepositoryService repositoryService;
    private final HistoryService historyService;
    private final ProcessDefinitionService processDefinitionService;

    private static final String PROCESS_KEY = "leaveProcess";

    /**
     * 提交请假申请
     */
    @Transactional
    public LeaveRequest submitLeaveRequest(LeaveRequestDTO dto) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("applicant", dto.getApplicant());
        variables.put("leaveType", dto.getLeaveType());
        variables.put("startDate", dto.getStartDate() != null ? dto.getStartDate().toString() : null);
        variables.put("endDate", dto.getEndDate() != null ? dto.getEndDate().toString() : null);
        variables.put("days", dto.getDays());
        variables.put("reason", dto.getReason());
        variables.put("approved", false);

        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(PROCESS_KEY, variables);
        log.info("启动请假流程，流程实例ID: {}", processInstance.getId());

        Task submitTask = taskService.createTaskQuery()
                .processInstanceId(processInstance.getId())
                .singleResult();
        if (submitTask != null) {
            taskService.complete(submitTask.getId());
            log.info("完成提交任务，流转到主管审批");
        }

        return getLeaveRequestByProcessInstanceId(processInstance.getId());
    }

    /**
     * 获取待办任务列表
     */
    public List<LeaveRequest> getPendingTasks(String assignee) {
        List<LeaveRequest> result = new ArrayList<>();

        List<Task> groupTasks;
        if ("managers".equals(assignee) || "hr".equals(assignee)) {
            groupTasks = taskService.createTaskQuery()
                    .taskCandidateGroup(assignee)
                    .list();
        } else {
            groupTasks = Collections.emptyList();
        }

        List<Task> personalTasks = taskService.createTaskQuery()
                .taskAssignee(assignee)
                .list();

        List<Task> allTasks = new ArrayList<>();
        allTasks.addAll(groupTasks);
        allTasks.addAll(personalTasks);

        for (Task task : allTasks) {
            LeaveRequest leaveRequest = buildLeaveRequestFromTask(task);
            result.add(leaveRequest);
        }

        return result;
    }

    /**
     * 审批操作
     */
    @Transactional
    public LeaveRequest approveTask(ApprovalDTO dto) {
        Task task = taskService.createTaskQuery()
                .taskId(dto.getTaskId())
                .singleResult();

        if (task == null) {
            throw new RuntimeException("任务不存在或已完成");
        }

        if (task.getAssignee() == null) {
            taskService.claim(dto.getTaskId(), dto.getApprover());
        }

        if (dto.getComment() != null) {
            taskService.addComment(dto.getTaskId(), task.getProcessInstanceId(), dto.getComment());
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", dto.getApproved());
        taskService.complete(dto.getTaskId(), variables);

        log.info("任务 {} 已审批，审批人: {}, 结果: {}", dto.getTaskId(), dto.getApprover(),
                dto.getApproved() ? "同意" : "拒绝");

        return getLeaveRequestByProcessInstanceIdOrHistory(task.getProcessInstanceId());
    }

    /**
     * 获取我提交的请假申请
     */
    public List<LeaveRequest> getMyLeaveRequests(String applicant) {
        List<LeaveRequest> result = new ArrayList<>();

        List<ProcessInstance> instances = runtimeService.createProcessInstanceQuery()
                .variableValueEquals("applicant", applicant)
                .list();

        for (ProcessInstance instance : instances) {
            LeaveRequest leaveRequest = getLeaveRequestByProcessInstanceId(instance.getId());
            if (leaveRequest != null) {
                result.add(leaveRequest);
            }
        }

        List<org.flowable.engine.history.HistoricProcessInstance> historicInstances =
                historyService.createHistoricProcessInstanceQuery()
                        .variableValueEquals("applicant", applicant)
                        .finished()
                        .includeProcessVariables()
                        .list();

        for (org.flowable.engine.history.HistoricProcessInstance hi : historicInstances) {
            LeaveRequest leaveRequest = new LeaveRequest();
            leaveRequest.setProcessInstanceId(hi.getId());
            leaveRequest.setApplicant((String) hi.getProcessVariables().get("applicant"));
            leaveRequest.setLeaveType((String) hi.getProcessVariables().get("leaveType"));
            leaveRequest.setStartDate(parseDate((String) hi.getProcessVariables().get("startDate")));
            leaveRequest.setEndDate(parseDate((String) hi.getProcessVariables().get("endDate")));
            leaveRequest.setDays((Integer) hi.getProcessVariables().get("days"));
            leaveRequest.setReason((String) hi.getProcessVariables().get("reason"));

            if (hi.getEndActivityId() != null) {
                if ("endApproved".equals(hi.getEndActivityId())) {
                    leaveRequest.setStatus("已通过");
                } else if ("endRejected".equals(hi.getEndActivityId())) {
                    leaveRequest.setStatus("已拒绝");
                }
            }
            result.add(leaveRequest);
        }

        return result;
    }

    /**
     * 获取流程详情
     */
    public LeaveRequest getLeaveRequestByProcessInstanceId(String processInstanceId) {
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .singleResult();

        if (instance == null) {
            return null;
        }

        Map<String, Object> variables = runtimeService.getVariables(processInstanceId);
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setProcessInstanceId(processInstanceId);
        leaveRequest.setApplicant((String) variables.get("applicant"));
        leaveRequest.setLeaveType((String) variables.get("leaveType"));
        leaveRequest.setStartDate(parseDate((String) variables.get("startDate")));
        leaveRequest.setEndDate(parseDate((String) variables.get("endDate")));
        leaveRequest.setDays((Integer) variables.get("days"));
        leaveRequest.setReason((String) variables.get("reason"));

        Task currentTask = taskService.createTaskQuery()
                .processInstanceId(processInstanceId)
                .singleResult();

        if (currentTask != null) {
            leaveRequest.setTaskId(currentTask.getId());
            leaveRequest.setTaskName(currentTask.getName());
            leaveRequest.setStatus(currentTask.getName());
        } else {
            leaveRequest.setStatus("已结束");
        }

        return leaveRequest;
    }

    private LeaveRequest buildLeaveRequestFromTask(Task task) {
        Map<String, Object> variables = taskService.getVariables(task.getId());
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setProcessInstanceId(task.getProcessInstanceId());
        leaveRequest.setApplicant((String) variables.get("applicant"));
        leaveRequest.setLeaveType((String) variables.get("leaveType"));
        leaveRequest.setStartDate(parseDate((String) variables.get("startDate")));
        leaveRequest.setEndDate(parseDate((String) variables.get("endDate")));
        leaveRequest.setDays((Integer) variables.get("days"));
        leaveRequest.setReason((String) variables.get("reason"));
        leaveRequest.setTaskId(task.getId());
        leaveRequest.setTaskName(task.getName());
        leaveRequest.setStatus(task.getName());
        return leaveRequest;
    }

    private java.time.LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        return java.time.LocalDate.parse(dateStr);
    }

    /**
     * 获取流程详情（运行时或历史）
     */
    private LeaveRequest getLeaveRequestByProcessInstanceIdOrHistory(String processInstanceId) {
        LeaveRequest leaveRequest = getLeaveRequestByProcessInstanceId(processInstanceId);
        if (leaveRequest != null) {
            return leaveRequest;
        }

        // 流程已结束，从历史表查询
        org.flowable.engine.history.HistoricProcessInstance hi =
                historyService.createHistoricProcessInstanceQuery()
                        .processInstanceId(processInstanceId)
                        .includeProcessVariables()
                        .singleResult();

        if (hi == null) {
            return null;
        }

        leaveRequest = new LeaveRequest();
        leaveRequest.setProcessInstanceId(hi.getId());
        leaveRequest.setApplicant((String) hi.getProcessVariables().get("applicant"));
        leaveRequest.setLeaveType((String) hi.getProcessVariables().get("leaveType"));
        leaveRequest.setStartDate(parseDate((String) hi.getProcessVariables().get("startDate")));
        leaveRequest.setEndDate(parseDate((String) hi.getProcessVariables().get("endDate")));
        leaveRequest.setDays((Integer) hi.getProcessVariables().get("days"));
        leaveRequest.setReason((String) hi.getProcessVariables().get("reason"));

        if (hi.getEndActivityId() != null) {
            if ("endApproved".equals(hi.getEndActivityId())) {
                leaveRequest.setStatus("已通过");
            } else if ("endRejected".equals(hi.getEndActivityId())) {
                leaveRequest.setStatus("已拒绝");
            }
        }
        return leaveRequest;
    }

    /**
     * 获取流程历史轨迹（含已完成与进行中节点）
     */
    public Map<String, Object> getProcessHistory(String processInstanceId) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        HistoricProcessInstance hi = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .includeProcessVariables()
                .singleResult();
        if (hi == null) {
            return null;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("processInstanceId", processInstanceId);
        String applicant = hi.getProcessVariables() != null
                ? (String) hi.getProcessVariables().get("applicant")
                : null;
        result.put("applicant", applicant);
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
                    .processInstanceId(processInstanceId)
                    .singleResult();
            currentStatus = t != null ? t.getName() : "处理中";
        }
        result.put("currentStatus", currentStatus);

        // 评论（按任务收集）
        List<Comment> allComments = taskService.getProcessInstanceComments(processInstanceId);
        Map<String, String> commentMap = new HashMap<>();
        for (Comment c : allComments) {
            if (c.getTaskId() != null) {
                commentMap.merge(c.getTaskId(), c.getFullMessage(),
                        (a, b) -> a + "\n" + b);
            }
        }

        // 历史任务（已完成 + 进行中）
        List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
                .processInstanceId(processInstanceId)
                .orderByHistoricTaskInstanceStartTime().asc()
                .list();

        List<Map<String, Object>> logs = new ArrayList<>();

        // 起始节点：发起人
        Map<String, Object> startLog = new LinkedHashMap<>();
        startLog.put("nodeName", "发起人");
        startLog.put("assignee", applicant != null ? applicant : "-");
        startLog.put("action", "提交");
        startLog.put("actionType", "submit");
        startLog.put("completed", true);
        startLog.put("time", hi.getStartTime() != null
                ? fmt.format(hi.getStartTime().toInstant().atZone(ZoneId.systemDefault()))
                : null);
        logs.add(startLog);

        for (HistoricTaskInstance t : tasks) {
            // 第一个名为「填写请假申请」的提交任务已用发起人节点表达，跳过
            if ("填写请假申请".equals(t.getName())) continue;

            Map<String, Object> log = new LinkedHashMap<>();
            log.put("nodeName", t.getName());
            log.put("assignee", t.getAssignee() != null ? t.getAssignee() :
                    (t.getClaimTime() == null ? ("managers".equals(t.getCategory()) ? "主管" : "") : ""));
            boolean completed = t.getEndTime() != null;
            log.put("completed", completed);

            String action;
            String actionType;
            if (completed) {
                if ("已通过".equals(currentStatus) && tasks.indexOf(t) == tasks.size() - 1) {
                    action = "通过"; actionType = "approve";
                } else if ("已拒绝".equals(currentStatus) && tasks.indexOf(t) == tasks.size() - 1) {
                    action = "拒绝"; actionType = "reject";
                } else {
                    action = "通过"; actionType = "approve";
                }
                log.put("time", t.getEndTime() != null
                        ? fmt.format(t.getEndTime().toInstant().atZone(ZoneId.systemDefault()))
                        : null);
            } else {
                action = "处理中"; actionType = "pending";
                log.put("time", null);
            }
            log.put("action", action);
            log.put("actionType", actionType);
            log.put("comment", commentMap.get(t.getId()));
            logs.add(log);
        }

        // 流程未完成时，追加「处理中」占位节点
        if (hi.getEndTime() == null) {
            Map<String, Object> tail = new LinkedHashMap<>();
            tail.put("nodeName", "处理中");
            tail.put("assignee", null);
            tail.put("action", null);
            tail.put("actionType", "pending");
            tail.put("completed", false);
            tail.put("time", null);
            tail.put("placeholder", true);
            logs.add(tail);
        }

        result.put("logs", logs);

        // 评论列表（用于「评论」Tab）
        List<Map<String, Object>> commentList = new ArrayList<>();
        for (Comment c : allComments) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("author", c.getUserId());
            m.put("content", c.getFullMessage());
            m.put("time", c.getTime() != null
                    ? fmt.format(c.getTime().toInstant().atZone(ZoneId.systemDefault()))
                    : null);
            commentList.add(m);
        }
        result.put("comments", commentList);

        return result;
    }

    /**
     * 获取流程图数据：BPMN XML + 节点执行状态
     */
    public Map<String, Object> getProcessDiagram(String processInstanceId) {
        HistoricProcessInstance hi = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .singleResult();
        if (hi == null) return null;

        String pdId = hi.getProcessDefinitionId();
        org.flowable.engine.repository.ProcessDefinition pd = repositoryService.createProcessDefinitionQuery()
                .processDefinitionId(pdId)
                .singleResult();
        if (pd == null) return null;

        String xml = processDefinitionService.getProcessXml(pd.getDeploymentId());

        List<HistoricActivityInstance> activities = historyService.createHistoricActivityInstanceQuery()
                .processInstanceId(processInstanceId)
                .orderByHistoricActivityInstanceStartTime().asc()
                .list();

        Set<String> completed = new LinkedHashSet<>();
        Set<String> active = new LinkedHashSet<>();
        Set<String> completedFlows = new LinkedHashSet<>();
        for (HistoricActivityInstance a : activities) {
            String aid = a.getActivityId();
            if (aid == null) continue;
            if ("sequenceFlow".equals(a.getActivityType())) {
                if (a.getEndTime() != null) completedFlows.add(aid);
                continue;
            }
            if (a.getEndTime() != null) completed.add(aid);
            else active.add(aid);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("processInstanceId", processInstanceId);
        result.put("processDefinitionId", pdId);
        result.put("processDefinitionKey", pd.getKey());
        result.put("processDefinitionName", pd.getName());
        result.put("xml", xml);
        result.put("completedActivityIds", new ArrayList<>(completed));
        result.put("activeActivityIds", new ArrayList<>(active));
        result.put("completedSequenceFlowIds", new ArrayList<>(completedFlows));
        result.put("finished", hi.getEndTime() != null);
        return result;
    }
}
