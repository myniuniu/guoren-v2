package com.guoren.workflow.service;

import com.guoren.workflow.dto.LeaveRequestDTO;
import com.guoren.workflow.entity.LeaveDraft;
import com.guoren.workflow.entity.LeaveRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 请假草稿服务（基于内存存储的简易实现）
 *
 * 提供"草稿 → 提交流程"两段式：
 * 1. 草稿阶段：可自由 CRUD，不影响 Flowable 引擎
 * 2. 提交阶段：调用 LeaveWorkflowService 启动 Flowable 流程，草稿状态变为 submitted
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveDraftService {

    private final LeaveWorkflowService leaveWorkflowService;

    /** 内存存储的草稿表 */
    private final Map<String, LeaveDraft> drafts = new ConcurrentHashMap<>();

    /**
     * 创建草稿
     */
    public LeaveDraft create(LeaveDraft input) {
        LeaveDraft draft = new LeaveDraft();
        draft.setId(UUID.randomUUID().toString().replace("-", ""));
        draft.setApplicant(input.getApplicant());
        draft.setLeaveType(input.getLeaveType());
        draft.setStartDate(input.getStartDate());
        draft.setEndDate(input.getEndDate());
        draft.setDays(input.getDays());
        draft.setReason(input.getReason());
        draft.setStatus("draft");
        LocalDateTime now = LocalDateTime.now();
        draft.setCreateTime(now);
        draft.setUpdateTime(now);
        drafts.put(draft.getId(), draft);
        log.info("创建请假草稿: {}", draft.getId());
        return draft;
    }

    /**
     * 更新草稿（仅草稿状态可改）
     */
    public LeaveDraft update(String id, LeaveDraft input) {
        LeaveDraft existed = drafts.get(id);
        if (existed == null) {
            throw new RuntimeException("草稿不存在: " + id);
        }
        if (!"draft".equals(existed.getStatus())) {
            throw new RuntimeException("仅草稿状态可编辑，当前状态: " + existed.getStatus());
        }
        if (input.getApplicant() != null) existed.setApplicant(input.getApplicant());
        if (input.getLeaveType() != null) existed.setLeaveType(input.getLeaveType());
        if (input.getStartDate() != null) existed.setStartDate(input.getStartDate());
        if (input.getEndDate() != null) existed.setEndDate(input.getEndDate());
        if (input.getDays() != null) existed.setDays(input.getDays());
        if (input.getReason() != null) existed.setReason(input.getReason());
        existed.setUpdateTime(LocalDateTime.now());
        log.info("更新请假草稿: {}", id);
        return existed;
    }

    /**
     * 删除草稿（仅草稿状态可删；已提交需通过流程取消）
     */
    public void delete(String id) {
        LeaveDraft existed = drafts.get(id);
        if (existed == null) {
            return;
        }
        if (!"draft".equals(existed.getStatus())) {
            throw new RuntimeException("已提交的请假不能直接删除");
        }
        drafts.remove(id);
        log.info("删除请假草稿: {}", id);
    }

    /**
     * 获取单个草稿
     */
    public LeaveDraft get(String id) {
        return drafts.get(id);
    }

    /**
     * 列表（按 applicant 过滤，可选）
     */
    public List<LeaveDraft> list(String applicant) {
        return drafts.values().stream()
                .filter(d -> applicant == null || applicant.isEmpty() || applicant.equals(d.getApplicant()))
                .sorted(Comparator.comparing(LeaveDraft::getCreateTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    /**
     * 提交草稿到 Flowable 流程引擎
     */
    public LeaveDraft submitToProcess(String id) {
        LeaveDraft draft = drafts.get(id);
        if (draft == null) {
            throw new RuntimeException("草稿不存在: " + id);
        }
        if (!"draft".equals(draft.getStatus())) {
            throw new RuntimeException("仅草稿状态可提交，当前状态: " + draft.getStatus());
        }

        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setApplicant(draft.getApplicant());
        dto.setLeaveType(draft.getLeaveType());
        dto.setStartDate(draft.getStartDate());
        dto.setEndDate(draft.getEndDate());
        dto.setDays(draft.getDays() == null ? null : draft.getDays().intValue());
        dto.setReason(draft.getReason());

        LeaveRequest result = leaveWorkflowService.submitLeaveRequest(dto);
        draft.setStatus("submitted");
        draft.setProcessInstanceId(result.getProcessInstanceId());
        draft.setUpdateTime(LocalDateTime.now());
        log.info("草稿 {} 已提交流程，实例: {}", id, result.getProcessInstanceId());
        return draft;
    }
}
