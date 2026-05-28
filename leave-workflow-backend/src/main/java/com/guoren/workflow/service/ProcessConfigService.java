package com.guoren.workflow.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guoren.workflow.dto.ProcessConfigPublishDTO;
import com.guoren.workflow.dto.ProcessConfigSaveDTO;
import com.guoren.workflow.dto.ProcessConfigVO;
import com.guoren.workflow.entity.ProcessConfig;
import com.guoren.workflow.entity.ProcessConfigVersion;
import com.guoren.workflow.mapper.ProcessConfigMapper;
import com.guoren.workflow.mapper.ProcessConfigVersionMapper;
import com.guoren.workflow.util.BpmnValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.repository.ProcessDefinition;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 流程配置服务
 *
 * 核心流程：
 * 1. saveDraft — 保存草稿（创建或更新 process_config 主表）
 * 2. publish — 发布版本（快照到 process_config_version + 部署 BPMN 到 Flowable）
 * 3. getByKey — 加载最新草稿（编辑时使用）
 * 4. getVersion — 加载指定版本快照（查看历史版本）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessConfigService {

    private final ProcessConfigMapper configMapper;
    private final ProcessConfigVersionMapper versionMapper;
    private final RepositoryService repositoryService;

    // ─── 保存草稿 ───

    /**
     * 保存草稿（创建或更新）
     * 如果 processKey 不存在则新建，存在则覆盖草稿数据
     */
    @Transactional
    public ProcessConfigVO saveDraft(ProcessConfigSaveDTO dto) {
        ProcessConfig config = configMapper.selectOne(
                new LambdaQueryWrapper<ProcessConfig>()
                        .eq(ProcessConfig::getProcessKey, dto.getProcessKey())
                        .eq(ProcessConfig::getDeleted, 0));

        LocalDateTime now = LocalDateTime.now();

        if (config == null) {
            // 新建
            config = new ProcessConfig();
            config.setId(UUID.randomUUID().toString().replace("-", ""));
            config.setProcessKey(dto.getProcessKey());
            config.setName(dto.getName() != null ? dto.getName() : dto.getProcessKey());
            config.setProcessGroup(dto.getProcessGroup());
            config.setDescription(dto.getDescription());
            config.setIcon(dto.getIcon());
            config.setFormSchemaJson(dto.getFormSchemaJson());
            config.setFlowJson(dto.getFlowJson());
            config.setSettingsJson(dto.getSettingsJson());
            config.setLatestVersion(0);
            config.setStatus("DRAFT");
            config.setCreateBy(dto.getProcessKey()); // TODO: 接入用户体系后替换
            config.setCreateTime(now);
            config.setUpdateTime(now);
            config.setDeleted(0);
            try {
                configMapper.insert(config);
            } catch (DuplicateKeyException e) {
                // 并发新建 或 前端静默归一 导致的唯一约束冲突
                log.warn("草稿保存冲突：processKey={} 已存在", dto.getProcessKey());
                throw new IllegalArgumentException(
                        "流程标识「" + dto.getProcessKey() + "」已被使用，请换一个标识重试",
                        e);
            }
            log.info("新建流程配置草稿: processKey={}", dto.getProcessKey());
        } else {
            // 更新草稿
            if (dto.getName() != null) config.setName(dto.getName());
            if (dto.getProcessGroup() != null) config.setProcessGroup(dto.getProcessGroup());
            if (dto.getDescription() != null) config.setDescription(dto.getDescription());
            if (dto.getIcon() != null) config.setIcon(dto.getIcon());
            if (dto.getFormSchemaJson() != null) config.setFormSchemaJson(dto.getFormSchemaJson());
            if (dto.getFlowJson() != null) config.setFlowJson(dto.getFlowJson());
            if (dto.getSettingsJson() != null) config.setSettingsJson(dto.getSettingsJson());
            config.setUpdateTime(now);
            // 如果修改了草稿，状态回退为 DRAFT（如果之前是 PUBLISHED）
            if ("PUBLISHED".equals(config.getStatus())) {
                config.setStatus("DRAFT");
            }
            configMapper.updateById(config);
            log.info("更新流程配置草稿: processKey={}", dto.getProcessKey());
        }

        return toVO(config, null, null);
    }

    // ─── 发布 ───

    /**
     * 发布流程配置
     * 1. 快照当前草稿到 process_config_version
     * 2. 部署 BPMN XML 到 Flowable
     * 3. 更新主表 latest_version 和 status
     */
    @Transactional
    public ProcessConfigVO publish(ProcessConfigPublishDTO dto) {
        // ── 前置校验 ──
        if (dto.getBpmnXml() == null || dto.getBpmnXml().isBlank()) {
            throw new IllegalArgumentException("BPMN XML 不能为空，请先设计流程");
        }
        if (dto.getProcessKey() == null || dto.getProcessKey().isBlank()) {
            throw new IllegalArgumentException("流程标识(processKey)不能为空");
        }

        // ── BPMN 结构校验（startEvent/endEvent/userTask/孤立节点/死路） ──
        // 校验失败会抛 IllegalArgumentException，由 GlobalExceptionHandler 转 400
        BpmnValidator.validate(dto.getBpmnXml());

        // 1. 查找或创建主表记录
        ProcessConfig config = configMapper.selectOne(
                new LambdaQueryWrapper<ProcessConfig>()
                        .eq(ProcessConfig::getProcessKey, dto.getProcessKey())
                        .eq(ProcessConfig::getDeleted, 0));

        LocalDateTime now = LocalDateTime.now();

        if (config == null) {
            // 发布时如果主表不存在，先创建
            config = new ProcessConfig();
            config.setId(UUID.randomUUID().toString().replace("-", ""));
            config.setProcessKey(dto.getProcessKey());
            config.setName(dto.getName() != null ? dto.getName() : dto.getProcessKey());
            config.setProcessGroup(dto.getProcessGroup());
            config.setDescription(dto.getDescription());
            config.setIcon(dto.getIcon());
            config.setFormSchemaJson(dto.getFormSchemaJson());
            config.setFlowJson(dto.getFlowJson());
            config.setSettingsJson(dto.getSettingsJson());
            config.setLatestVersion(0);
            config.setCreateBy(dto.getProcessKey());
            config.setCreateTime(now);
            config.setDeleted(0);
            try {
                configMapper.insert(config);
            } catch (DuplicateKeyException e) {
                log.warn("发布时新建冲突：processKey={} 已存在", dto.getProcessKey());
                throw new IllegalArgumentException(
                        "流程标识「" + dto.getProcessKey() + "」已被使用，请换一个标识重试",
                        e);
            }
        } else {
            // 更新草稿数据为发布时刻的数据
            if (dto.getName() != null) config.setName(dto.getName());
            if (dto.getProcessGroup() != null) config.setProcessGroup(dto.getProcessGroup());
            if (dto.getDescription() != null) config.setDescription(dto.getDescription());
            if (dto.getIcon() != null) config.setIcon(dto.getIcon());
            if (dto.getFormSchemaJson() != null) config.setFormSchemaJson(dto.getFormSchemaJson());
            if (dto.getFlowJson() != null) config.setFlowJson(dto.getFlowJson());
            if (dto.getSettingsJson() != null) config.setSettingsJson(dto.getSettingsJson());
        }

        // 2. 计算新版本号
        int newVersion = (config.getLatestVersion() != null ? config.getLatestVersion() : 0) + 1;

        // 3. 部署 BPMN XML 到 Flowable
        String resourceName = (dto.getDeployName() != null ?
                dto.getDeployName().replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5_-]", "_") :
                dto.getProcessKey()) + ".bpmn20.xml";

        Deployment deployment;
        try {
            deployment = repositoryService.createDeployment()
                    .addInputStream(resourceName,
                            new ByteArrayInputStream(dto.getBpmnXml().getBytes(StandardCharsets.UTF_8)))
                    .name(dto.getDeployName() != null ? dto.getDeployName() : dto.getProcessKey())
                    .deploy();
        } catch (Exception e) {
            log.error("BPMN 部署失败: processKey={}, error={}", dto.getProcessKey(), e.getMessage(), e);
            throw new RuntimeException("流程部署失败: " + e.getMessage(), e);
        }

        log.info("BPMN 部署成功: deploymentId={}, processKey={}", deployment.getId(), dto.getProcessKey());

        // 查询部署后的流程定义
        ProcessDefinition pd = repositoryService.createProcessDefinitionQuery()
                .deploymentId(deployment.getId())
                .singleResult();

        String flowableDeploymentId = deployment.getId();
        String flowableProcessDefId = pd != null ? pd.getId() : null;

        // 4. 创建版本快照
        ProcessConfigVersion version = new ProcessConfigVersion();
        version.setId(UUID.randomUUID().toString().replace("-", ""));
        version.setConfigId(config.getId());
        version.setProcessKey(dto.getProcessKey());
        version.setVersion(newVersion);
        version.setFormSchemaJson(dto.getFormSchemaJson());
        version.setFlowJson(dto.getFlowJson());
        version.setSettingsJson(dto.getSettingsJson());
        version.setBpmnXml(dto.getBpmnXml());
        version.setFlowableDeploymentId(flowableDeploymentId);
        version.setFlowableProcessDefId(flowableProcessDefId);
        version.setPublished(1);
        version.setPublishTime(now);
        version.setCreateBy(dto.getProcessKey());
        version.setCreateTime(now);
        versionMapper.insert(version);

        // 5. 更新主表版本号和状态
        config.setLatestVersion(newVersion);
        config.setStatus("PUBLISHED");
        config.setUpdateTime(now);
        configMapper.updateById(config);

        log.info("流程配置发布成功: processKey={}, version={}, deploymentId={}",
                dto.getProcessKey(), newVersion, flowableDeploymentId);

        return toVO(config, flowableDeploymentId, flowableProcessDefId);
    }

    // ─── 查询 ───

    /**
     * 根据 processKey 获取最新配置（草稿）
     */
    public ProcessConfigVO getByKey(String processKey) {
        ProcessConfig config = configMapper.selectOne(
                new LambdaQueryWrapper<ProcessConfig>()
                        .eq(ProcessConfig::getProcessKey, processKey)
                        .eq(ProcessConfig::getDeleted, 0));

        if (config == null) return null;

        // 查找最新版本快照的 Flowable 关联信息
        String flowableDeploymentId = null;
        String flowableProcessDefId = null;
        if (config.getLatestVersion() != null && config.getLatestVersion() > 0) {
            ProcessConfigVersion latestVer = versionMapper.selectOne(
                    new LambdaQueryWrapper<ProcessConfigVersion>()
                            .eq(ProcessConfigVersion::getConfigId, config.getId())
                            .eq(ProcessConfigVersion::getVersion, config.getLatestVersion()));
            if (latestVer != null) {
                flowableDeploymentId = latestVer.getFlowableDeploymentId();
                flowableProcessDefId = latestVer.getFlowableProcessDefId();
            }
        }

        return toVO(config, flowableDeploymentId, flowableProcessDefId);
    }

    /**
     * 获取所有流程配置列表
     */
    public List<ProcessConfigVO> listAll() {
        List<ProcessConfig> configs = configMapper.selectList(
                new LambdaQueryWrapper<ProcessConfig>()
                        .eq(ProcessConfig::getDeleted, 0)
                        .orderByDesc(ProcessConfig::getUpdateTime));

        return configs.stream().map(c -> {
            String depId = null;
            String defId = null;
            if (c.getLatestVersion() != null && c.getLatestVersion() > 0) {
                ProcessConfigVersion v = versionMapper.selectOne(
                        new LambdaQueryWrapper<ProcessConfigVersion>()
                                .eq(ProcessConfigVersion::getConfigId, c.getId())
                                .eq(ProcessConfigVersion::getVersion, c.getLatestVersion()));
                if (v != null) {
                    depId = v.getFlowableDeploymentId();
                    defId = v.getFlowableProcessDefId();
                }
            }
            return toVO(c, depId, defId);
        }).collect(Collectors.toList());
    }

    /**
     * 获取指定版本的配置快照
     */
    public ProcessConfigVO getVersion(String processKey, Integer version) {
        ProcessConfigVersion v = versionMapper.selectOne(
                new LambdaQueryWrapper<ProcessConfigVersion>()
                        .eq(ProcessConfigVersion::getProcessKey, processKey)
                        .eq(ProcessConfigVersion::getVersion, version));

        if (v == null) return null;

        ProcessConfigVO vo = new ProcessConfigVO();
        vo.setProcessKey(v.getProcessKey());
        vo.setFormSchemaJson(v.getFormSchemaJson());
        vo.setFlowJson(v.getFlowJson());
        vo.setSettingsJson(v.getSettingsJson());
        vo.setLatestVersion(v.getVersion());
        vo.setFlowableDeploymentId(v.getFlowableDeploymentId());
        vo.setFlowableProcessDefId(v.getFlowableProcessDefId());
        vo.setStatus("PUBLISHED");
        return vo;
    }

    /**
     * 获取流程配置的所有版本列表
     */
    public List<ProcessConfigVersion> listVersions(String processKey) {
        return versionMapper.selectList(
                new LambdaQueryWrapper<ProcessConfigVersion>()
                        .eq(ProcessConfigVersion::getProcessKey, processKey)
                        .orderByDesc(ProcessConfigVersion::getVersion));
    }

    /**
     * 回滚草稿到指定版本快照
     * 把 process_config_version 的 schema/flow/settings 拷贝回主表，
     * 并重置状态为 DRAFT、清空 latest_version（草稿不再有“已发布”语义）
     */
    @Transactional
    public ProcessConfigVO rollbackToVersion(String processKey, Integer version) {
        if (version == null || version <= 0) {
            throw new IllegalArgumentException("版本号必须大于 0");
        }
        ProcessConfig config = configMapper.selectOne(
                new LambdaQueryWrapper<ProcessConfig>()
                        .eq(ProcessConfig::getProcessKey, processKey)
                        .eq(ProcessConfig::getDeleted, 0));
        if (config == null) {
            throw new IllegalArgumentException("流程「" + processKey + "」不存在");
        }
        ProcessConfigVersion snapshot = versionMapper.selectOne(
                new LambdaQueryWrapper<ProcessConfigVersion>()
                        .eq(ProcessConfigVersion::getConfigId, config.getId())
                        .eq(ProcessConfigVersion::getVersion, version));
        if (snapshot == null) {
            throw new IllegalArgumentException("版本 v" + version + " 不存在");
        }
        // 把快照覆盖到主表（保留 latest_version，确保下一次发布能接着递增）
        if (snapshot.getFormSchemaJson() != null) config.setFormSchemaJson(snapshot.getFormSchemaJson());
        if (snapshot.getFlowJson() != null) config.setFlowJson(snapshot.getFlowJson());
        if (snapshot.getSettingsJson() != null) config.setSettingsJson(snapshot.getSettingsJson());
        config.setStatus("DRAFT"); // 回滚后重新变为草稿
        config.setUpdateTime(LocalDateTime.now());
        configMapper.updateById(config);
        log.info("草稿已回滚到版本 v{}：processKey={}", version, processKey);

        // 返回最新草稿
        return toVO(config, null, null);
    }

    // ─── 删除 ───

    /**
     * 删除流程配置（逻辑删除）
     * 注意：必须用 deleteById 而非 updateById，因为 MyBatis-Plus 全局配置了 logic-delete-field=deleted，
     * updateById 不会将 deleted 字段放入 SET 子句（它被 MyBatis-Plus 内部管理）
     */
    @Transactional
    public void deleteByKey(String processKey) {
        ProcessConfig config = configMapper.selectOne(
                new LambdaQueryWrapper<ProcessConfig>()
                        .eq(ProcessConfig::getProcessKey, processKey)
                        .eq(ProcessConfig::getDeleted, 0));

        if (config != null) {
            // deleteById 在逻辑删除模式下会自动转为 UPDATE SET deleted=1 WHERE id=? AND deleted=0
            configMapper.deleteById(config.getId());
            log.info("逻辑删除流程配置: processKey={}", processKey);
        }
    }

    // ─── 内部方法 ───

    private ProcessConfigVO toVO(ProcessConfig config, String flowableDeploymentId, String flowableProcessDefId) {
        ProcessConfigVO vo = new ProcessConfigVO();
        vo.setId(config.getId());
        vo.setProcessKey(config.getProcessKey());
        vo.setName(config.getName());
        vo.setProcessGroup(config.getProcessGroup());
        vo.setDescription(config.getDescription());
        vo.setIcon(config.getIcon());
        vo.setFormSchemaJson(config.getFormSchemaJson());
        vo.setFlowJson(config.getFlowJson());
        vo.setSettingsJson(config.getSettingsJson());
        vo.setLatestVersion(config.getLatestVersion());
        vo.setStatus(config.getStatus());
        vo.setFlowableDeploymentId(flowableDeploymentId);
        vo.setFlowableProcessDefId(flowableProcessDefId);
        vo.setCreateBy(config.getCreateBy());
        vo.setCreateTime(config.getCreateTime() != null ? config.getCreateTime().toString() : null);
        vo.setUpdateTime(config.getUpdateTime() != null ? config.getUpdateTime().toString() : null);
        return vo;
    }
}
