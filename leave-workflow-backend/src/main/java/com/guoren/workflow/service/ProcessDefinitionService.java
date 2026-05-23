package com.guoren.workflow.service;

import com.guoren.workflow.dto.DeployRequestDTO;
import com.guoren.workflow.entity.ProcessDefinitionVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.repository.ProcessDefinition;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 流程定义管理服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessDefinitionService {

    private final RepositoryService repositoryService;

    /**
     * 获取流程定义列表
     */
    public List<ProcessDefinitionVO> listProcessDefinitions() {
        List<ProcessDefinition> definitions = repositoryService.createProcessDefinitionQuery()
                .orderByProcessDefinitionKey()
                .asc()
                .list();

        List<ProcessDefinitionVO> result = new ArrayList<>();
        for (ProcessDefinition pd : definitions) {
            result.add(toVO(pd));
        }
        return result;
    }

    /**
     * 根据流程key获取最新版本的流程定义
     */
    public ProcessDefinitionVO getProcessByKey(String processKey) {
        ProcessDefinition pd = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(processKey)
                .latestVersion()
                .singleResult();

        if (pd == null) {
            throw new RuntimeException("未找到流程定义: " + processKey);
        }
        return toVO(pd);
    }

    private ProcessDefinitionVO toVO(ProcessDefinition pd) {
        ProcessDefinitionVO vo = new ProcessDefinitionVO();
        vo.setId(pd.getId());
        vo.setKey(pd.getKey());
        vo.setName(pd.getName());
        vo.setVersion(pd.getVersion());
        vo.setDeploymentId(pd.getDeploymentId());
        vo.setResourceName(pd.getResourceName());
        vo.setSuspensionState(pd.isSuspended() ? 0 : 1);
        return vo;
    }

    /**
     * 获取流程XML
     */
    public String getProcessXml(String deploymentId) {
        List<String> resourceNames = repositoryService.getDeploymentResourceNames(deploymentId);
        String bpmnResource = resourceNames.stream()
                .filter(name -> name.endsWith(".bpmn") || name.endsWith(".bpmn20.xml"))
                .findFirst()
                .orElse(null);

        if (bpmnResource == null) {
            throw new RuntimeException("部署中未找到BPMN资源文件");
        }

        try {
            byte[] bytes = repositoryService.getResourceAsStream(deploymentId, bpmnResource).readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("读取流程XML失败", e);
        }
    }

    /**
     * 部署流程定义
     */
    @Transactional
    public ProcessDefinitionVO deployProcess(DeployRequestDTO dto) {
        String resourceName = dto.getName() != null ?
                dto.getName().replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5_-]", "_") + ".bpmn20.xml" :
                "process.bpmn20.xml";

        Deployment deployment = repositoryService.createDeployment()
                .addInputStream(resourceName,
                        new ByteArrayInputStream(dto.getXml().getBytes(StandardCharsets.UTF_8)))
                .name(dto.getName())
                .deploy();

        log.info("流程部署成功，部署ID: {}", deployment.getId());

        // 查询刚部署的流程定义
        ProcessDefinition pd = repositoryService.createProcessDefinitionQuery()
                .deploymentId(deployment.getId())
                .singleResult();

        if (pd == null) {
            throw new RuntimeException("部署后未找到流程定义，请检查XML格式");
        }

        ProcessDefinitionVO vo = toVO(pd);
        vo.setSuspensionState(1);
        return vo;
    }

    /**
     * 删除流程定义（通过部署ID）
     */
    @Transactional
    public void deleteProcess(String deploymentId) {
        repositoryService.deleteDeployment(deploymentId, true);
        log.info("流程部署已删除，部署ID: {}", deploymentId);
    }
}
