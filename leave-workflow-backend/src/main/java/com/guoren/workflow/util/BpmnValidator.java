package com.guoren.workflow.util;

import lombok.extern.slf4j.Slf4j;
import org.flowable.bpmn.converter.BpmnXMLConverter;
import org.flowable.bpmn.model.BpmnModel;
import org.flowable.bpmn.model.EndEvent;
import org.flowable.bpmn.model.FlowElement;
import org.flowable.bpmn.model.Process;
import org.flowable.bpmn.model.SequenceFlow;
import org.flowable.bpmn.model.StartEvent;
import org.flowable.bpmn.model.UserTask;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamReader;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * BPMN XML 结构校验工具
 *
 * 在 Flowable 真正部署之前，对 BPMN 进行结构性检查，
 * 提前以可读消息抛出 IllegalArgumentException，避免拿到底层引擎的晦涩错误。
 *
 * 校验项：
 *  1. XML 能被解析为 BpmnModel 且至少包含 1 个 Process
 *  2. Process 必须至少 1 个 StartEvent
 *  3. Process 必须至少 1 个 EndEvent
 *  4. Process 必须至少 1 个 UserTask（审批节点）
 *  5. 非 StartEvent 的节点必须有入边（无孤立节点）
 *  6. 非 EndEvent 的节点必须有出边（不存在死路）
 *  7. SequenceFlow 的 sourceRef / targetRef 必须存在
 */
@Slf4j
public class BpmnValidator {

    private BpmnValidator() { }

    /**
     * 校验 BPMN XML 结构
     * @param bpmnXml BPMN XML 字符串
     * @throws IllegalArgumentException 校验失败，message 为人类可读的问题清单
     */
    public static void validate(String bpmnXml) {
        if (bpmnXml == null || bpmnXml.isBlank()) {
            throw new IllegalArgumentException("BPMN XML 不能为空");
        }

        BpmnModel model;
        try {
            BpmnXMLConverter converter = new BpmnXMLConverter();
            XMLInputFactory xif = XMLInputFactory.newInstance();
            // 关闭外部实体，避免 XXE
            xif.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);
            xif.setProperty(XMLInputFactory.SUPPORT_DTD, false);
            XMLStreamReader reader = xif.createXMLStreamReader(
                    new ByteArrayInputStream(bpmnXml.getBytes(StandardCharsets.UTF_8)));
            // 第二个参数 validateSchema=false 关闭 XSD 校验（允许 flowable: 扩展元素）
            model = converter.convertToBpmnModel(reader);
        } catch (Exception e) {
            log.warn("BPMN XML 解析失败: {}", e.getMessage());
            throw new IllegalArgumentException("BPMN XML 格式不合法: " + e.getMessage());
        }

        if (model == null || model.getProcesses() == null || model.getProcesses().isEmpty()) {
            throw new IllegalArgumentException("BPMN XML 中未发现任何 process 流程定义");
        }

        List<String> errors = new ArrayList<>();
        for (Process process : model.getProcesses()) {
            validateProcess(process, errors);
        }

        if (!errors.isEmpty()) {
            String msg = "流程结构校验未通过：\n" + String.join("\n", errors);
            throw new IllegalArgumentException(msg);
        }
    }

    private static void validateProcess(Process process, List<String> errors) {
        String pid = process.getId() != null ? process.getId() : "(无 id)";

        Collection<FlowElement> elements = process.getFlowElements();
        if (elements == null || elements.isEmpty()) {
            errors.add("[" + pid + "] 流程没有任何节点");
            return;
        }

        // 1. 节点类型统计
        List<StartEvent> starts = process.findFlowElementsOfType(StartEvent.class, false);
        List<EndEvent> ends = process.findFlowElementsOfType(EndEvent.class, false);
        List<UserTask> userTasks = process.findFlowElementsOfType(UserTask.class, false);
        List<SequenceFlow> flows = process.findFlowElementsOfType(SequenceFlow.class, false);

        if (starts.isEmpty()) {
            errors.add("[" + pid + "] 缺少开始节点（startEvent）");
        } else if (starts.size() > 1) {
            errors.add("[" + pid + "] 存在多个开始节点（startEvent），数量=" + starts.size());
        }
        if (ends.isEmpty()) {
            errors.add("[" + pid + "] 缺少结束节点（endEvent）");
        }
        if (userTasks.isEmpty()) {
            errors.add("[" + pid + "] 至少需要一个审批节点（userTask）");
        }

        // 2. 收集所有节点 id
        Set<String> nodeIds = new HashSet<>();
        for (FlowElement el : elements) {
            if (el instanceof SequenceFlow) continue;
            nodeIds.add(el.getId());
        }

        // 3. SequenceFlow 端点完整性 + 收集入边/出边
        Set<String> hasIncoming = new HashSet<>();
        Set<String> hasOutgoing = new HashSet<>();
        for (SequenceFlow sf : flows) {
            String src = sf.getSourceRef();
            String tgt = sf.getTargetRef();
            if (src == null || src.isBlank() || tgt == null || tgt.isBlank()) {
                errors.add("[" + pid + "] 存在残缺连线（id=" + sf.getId() + "），缺少 source 或 target");
                continue;
            }
            if (!nodeIds.contains(src)) {
                errors.add("[" + pid + "] 连线 " + sf.getId() + " 的 source 指向不存在的节点：" + src);
            }
            if (!nodeIds.contains(tgt)) {
                errors.add("[" + pid + "] 连线 " + sf.getId() + " 的 target 指向不存在的节点：" + tgt);
            }
            hasOutgoing.add(src);
            hasIncoming.add(tgt);
        }

        // 4. 孤立节点与死路检测
        for (FlowElement el : elements) {
            if (el instanceof SequenceFlow) continue;
            String id = el.getId();
            String name = el.getName() != null && !el.getName().isBlank() ? el.getName() : id;
            boolean isStart = el instanceof StartEvent;
            boolean isEnd = el instanceof EndEvent;
            if (!isStart && !hasIncoming.contains(id)) {
                errors.add("[" + pid + "] 节点「" + name + "」没有上游连接（孤立节点）");
            }
            if (!isEnd && !hasOutgoing.contains(id)) {
                errors.add("[" + pid + "] 节点「" + name + "」没有下游连接（流程在此处中断）");
            }
        }
    }
}
