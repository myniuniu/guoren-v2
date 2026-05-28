package com.guoren.workflow.service;

import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.springframework.stereotype.Service;

/**
 * 审批人解析服务（流程设计 V2 配套）
 *
 * Flowable BPMN 用户任务的 flowable:assignee 表达式
 *   <code>${approvalService.resolveXxx(execution, ...)}</code>
 * 会调用本服务的对应方法，根据流程变量与组织架构推导出实际审批人。
 *
 * 当前为 stub 实现：返回带语义的 mock userId，让 Flowable 引擎能正常推进流程；
 * 后续接入真实组织架构 / HRM 时只需替换内部实现，不需要改动 BPMN 与前端。
 *
 * Spring Bean 名为 "approvalService"（小写开头），与前端 flowToBpmn.js 中
 * 写出的 EL 表达式完全一致。
 */
@Slf4j
@Service("approvalService")
public class ApprovalService {

    /**
     * 解析"上级"审批人。
     *
     * @param execution 流程执行上下文（可读取 applicant 等流程变量）
     * @param level     层级，例：直属上级、直属上级加 1 级、最高上级、最高上级减 2 级
     * @return 解析后的用户 id
     */
    public String resolveLeader(DelegateExecution execution, String level) {
        String applicant = readApplicant(execution);
        log.info("[ApprovalService] resolveLeader applicant={} level={}", applicant, level);
        // TODO: 接入组织架构后按 applicant + level 真实查询
        return mockUser("leader", applicant, level);
    }

    /**
     * 解析"部门负责人"。
     *
     * @param level 层级，例：直属部门负责人、直属部门负责人加 1 级、最高部门负责人减 1 级
     * @param mode  "up" 向上 / "down" 向下
     */
    public String resolveDeptHead(DelegateExecution execution, String level, String mode) {
        String applicant = readApplicant(execution);
        log.info("[ApprovalService] resolveDeptHead applicant={} level={} mode={}",
                applicant, level, mode);
        return mockUser("deptHead", applicant, level + "/" + mode);
    }

    /**
     * 解析"连续多级审批"中单一节点。
     *
     * @param endpoint "leader" / "deptHead"，决定当前节点取哪种链路
     * @param level    层级
     * @param mode     up / down
     */
    public String resolveMultiLevel(DelegateExecution execution, String endpoint,
                                    String level, String mode) {
        String applicant = readApplicant(execution);
        log.info("[ApprovalService] resolveMultiLevel applicant={} endpoint={} level={} mode={}",
                applicant, endpoint, level, mode);
        return mockUser("multi-" + endpoint, applicant, level + "/" + mode);
    }

    /**
     * 解析"表单内联系人"字段对应的用户。
     *
     * @param fieldKey 表单字段 key（前端配置时填写）
     */
    public String resolveFormContact(DelegateExecution execution, String fieldKey) {
        Object v = execution.getVariable(fieldKey);
        log.info("[ApprovalService] resolveFormContact field={} value={}", fieldKey, v);
        if (v == null) return mockUser("form-contact", null, fieldKey);
        return String.valueOf(v);
    }

    /**
     * 解析"表单内部门"字段对应的部门负责人。
     */
    public String resolveFormDept(DelegateExecution execution, String fieldKey, String level) {
        Object v = execution.getVariable(fieldKey);
        log.info("[ApprovalService] resolveFormDept field={} value={} level={}",
                fieldKey, v, level);
        return mockUser("form-dept", String.valueOf(v), level);
    }

    /* ---------------- helpers ---------------- */

    private String readApplicant(DelegateExecution execution) {
        Object v = execution.getVariable("applicant");
        return v != null ? String.valueOf(v) : "unknown";
    }

    /**
     * 生成带语义的 mock 用户 id，便于联调时识别。
     * 真实项目接入组织架构后此方法可移除。
     */
    private String mockUser(String type, String applicant, String hint) {
        StringBuilder sb = new StringBuilder("mock-").append(type);
        if (applicant != null && !applicant.isEmpty()) {
            sb.append("-of-").append(applicant);
        }
        if (hint != null && !hint.isEmpty()) {
            sb.append("[").append(hint).append("]");
        }
        return sb.toString();
    }
}
