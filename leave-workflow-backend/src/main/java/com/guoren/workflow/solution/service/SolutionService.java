package com.guoren.workflow.solution.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guoren.workflow.solution.dto.SolutionAppConfigDTO;
import com.guoren.workflow.solution.dto.SolutionAppDTO;
import com.guoren.workflow.solution.dto.SolutionDTO;
import com.guoren.workflow.solution.entity.AppCatalog;
import com.guoren.workflow.solution.entity.Solution;
import com.guoren.workflow.solution.entity.SolutionApp;
import com.guoren.workflow.solution.entity.SolutionAppConfig;
import com.guoren.workflow.solution.entity.Tenant;
import com.guoren.workflow.solution.mapper.AppCatalogMapper;
import com.guoren.workflow.solution.mapper.SolutionAppConfigMapper;
import com.guoren.workflow.solution.mapper.SolutionAppMapper;
import com.guoren.workflow.solution.mapper.SolutionMapper;
import com.guoren.workflow.solution.mapper.TenantMapper;
import com.guoren.workflow.solution.vo.SolutionAppConfigVO;
import com.guoren.workflow.solution.vo.SolutionDetailVO;
import com.guoren.workflow.solution.vo.SolutionInstalledAppVO;
import com.guoren.workflow.solution.vo.SolutionListItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.guoren.workflow.solution.service.SolutionModuleSupport.generateCode;
import static com.guoren.workflow.solution.service.SolutionModuleSupport.trimToNull;

/**
 * 解决方案管理服务
 */
@Service
@RequiredArgsConstructor
public class SolutionService {

    private final SolutionMapper solutionMapper;
    private final TenantMapper tenantMapper;
    private final AppCatalogMapper appCatalogMapper;
    private final SolutionAppMapper solutionAppMapper;
    private final SolutionAppConfigMapper solutionAppConfigMapper;

    public List<SolutionListItemVO> list(String keyword, String tenantId, String status) {
        LambdaQueryWrapper<Solution> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Solution::getUpdateTime).orderByDesc(Solution::getCreateTime);
        String kw = trimToNull(keyword);
        if (kw != null) {
            wrapper.and(q -> q.like(Solution::getName, kw).or().like(Solution::getSolutionCode, kw));
        }
        String normalizedTenantId = trimToNull(tenantId);
        if (normalizedTenantId != null) {
            wrapper.eq(Solution::getTenantId, normalizedTenantId);
        }
        String normalizedStatus = trimToNull(status);
        if (normalizedStatus != null) {
            wrapper.eq(Solution::getStatus, normalizedStatus);
        }

        List<Solution> solutions = solutionMapper.selectList(wrapper);
        if (solutions.isEmpty()) {
            return List.of();
        }

        Map<String, String> tenantNameMap = tenantMapper.selectBatchIds(solutions.stream()
                        .map(Solution::getTenantId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Tenant::getId, Tenant::getName));

        List<SolutionApp> solutionApps = solutionAppMapper.selectList(new LambdaQueryWrapper<SolutionApp>()
                .in(SolutionApp::getSolutionId, solutions.stream().map(Solution::getId).toList()));
        Map<String, Integer> appCountMap = new HashMap<>();
        Map<String, Integer> pendingCountMap = new HashMap<>();
        for (SolutionApp item : solutionApps) {
            appCountMap.merge(item.getSolutionId(), 1, Integer::sum);
            if (!"DONE".equals(item.getDeployStatus())) {
                pendingCountMap.merge(item.getSolutionId(), 1, Integer::sum);
            }
        }

        List<SolutionListItemVO> result = new ArrayList<>();
        for (Solution solution : solutions) {
            SolutionListItemVO vo = new SolutionListItemVO();
            vo.setId(solution.getId());
            vo.setSolutionCode(solution.getSolutionCode());
            vo.setName(solution.getName());
            vo.setTenantId(solution.getTenantId());
            vo.setTenantName(tenantNameMap.get(solution.getTenantId()));
            vo.setDescription(solution.getDescription());
            vo.setStatus(solution.getStatus());
            vo.setOwner(solution.getOwner());
            vo.setGoLiveDate(solution.getGoLiveDate());
            vo.setAppCount(appCountMap.getOrDefault(solution.getId(), 0));
            vo.setPendingAppCount(pendingCountMap.getOrDefault(solution.getId(), 0));
            vo.setUpdateTime(solution.getUpdateTime());
            result.add(vo);
        }
        return result;
    }

    public SolutionDetailVO detail(String id) {
        Solution solution = solutionMapper.selectById(id);
        if (solution == null) {
            throw new IllegalArgumentException("解决方案不存在: " + id);
        }
        return buildDetail(solution);
    }

    @Transactional
    public SolutionDetailVO create(SolutionDTO dto) {
        String name = trimToNull(dto.getName());
        if (name == null) {
            throw new IllegalArgumentException("方案名称不能为空");
        }
        Tenant tenant = requireTenant(dto.getTenantId());
        assertTenantUnbound(tenant.getId(), null);

        String code = trimToNull(dto.getSolutionCode());
        if (code == null) {
            code = generateUniqueCode("SOL");
        } else {
            assertUniqueCode(code, null);
        }

        LocalDateTime now = LocalDateTime.now();
        Solution solution = new Solution();
        solution.setSolutionCode(code);
        solution.setName(name);
        solution.setTenantId(tenant.getId());
        solution.setDescription(trimToNull(dto.getDescription()));
        solution.setStatus(normalizeStatus(dto.getStatus(), "DRAFT"));
        solution.setOwner(trimToNull(dto.getOwner()));
        solution.setGoLiveDate(dto.getGoLiveDate());
        solution.setCreateTime(now);
        solution.setUpdateTime(now);
        if ("ACTIVE".equals(solution.getStatus())) {
            throw new IllegalArgumentException("新建方案时请先保存为草稿，完成应用与配置后再激活");
        }
        solutionMapper.insert(solution);
        return buildDetail(solution);
    }

    @Transactional
    public SolutionDetailVO update(String id, SolutionDTO dto) {
        Solution solution = solutionMapper.selectById(id);
        if (solution == null) {
            throw new IllegalArgumentException("解决方案不存在: " + id);
        }

        if (trimToNull(dto.getTenantId()) != null && !Objects.equals(dto.getTenantId(), solution.getTenantId())) {
            Tenant tenant = requireTenant(dto.getTenantId());
            assertTenantUnbound(tenant.getId(), id);
            solution.setTenantId(tenant.getId());
        }

        String code = trimToNull(dto.getSolutionCode());
        if (code != null && !Objects.equals(code, solution.getSolutionCode())) {
            assertUniqueCode(code, id);
            solution.setSolutionCode(code);
        }
        String name = trimToNull(dto.getName());
        if (name != null) {
            solution.setName(name);
        }
        if (dto.getDescription() != null) {
            solution.setDescription(trimToNull(dto.getDescription()));
        }
        if (dto.getOwner() != null) {
            solution.setOwner(trimToNull(dto.getOwner()));
        }
        if (dto.getGoLiveDate() != null) {
            solution.setGoLiveDate(dto.getGoLiveDate());
        }

        String newStatus = trimToNull(dto.getStatus()) != null
                ? normalizeStatus(dto.getStatus(), solution.getStatus())
                : solution.getStatus();
        if ("ACTIVE".equals(newStatus)) {
            validateCanActivate(solution);
        }
        solution.setStatus(newStatus);
        solution.setUpdateTime(LocalDateTime.now());
        solutionMapper.updateById(solution);
        return buildDetail(solution);
    }

    @Transactional
    public void remove(String id) {
        Solution solution = solutionMapper.selectById(id);
        if (solution == null) {
            return;
        }
        List<SolutionApp> apps = solutionAppMapper.selectList(new LambdaQueryWrapper<SolutionApp>()
                .eq(SolutionApp::getSolutionId, id));
        deleteAppsAndConfigs(apps);
        solutionMapper.deleteById(id);
    }

    @Transactional
    public SolutionDetailVO updateApps(String solutionId, List<SolutionAppDTO> items) {
        Solution solution = requireSolution(solutionId);
        List<SolutionAppDTO> payload = items == null ? List.of() : items;
        assertDistinctAppIds(payload);

        List<SolutionApp> existingApps = solutionAppMapper.selectList(new LambdaQueryWrapper<SolutionApp>()
                .eq(SolutionApp::getSolutionId, solutionId));
        Map<String, SolutionApp> byId = existingApps.stream()
                .collect(Collectors.toMap(SolutionApp::getId, item -> item));
        Map<String, SolutionApp> byAppId = existingApps.stream()
                .collect(Collectors.toMap(SolutionApp::getAppId, item -> item));

        Set<String> appIds = payload.stream().map(SolutionAppDTO::getAppId).collect(Collectors.toSet());
        Map<String, AppCatalog> appCatalogMap = fetchAppCatalogMap(appIds);

        Set<String> keepIds = new HashSet<>();
        int index = 1;
        LocalDateTime now = LocalDateTime.now();
        for (SolutionAppDTO dto : payload) {
            AppCatalog appCatalog = appCatalogMap.get(dto.getAppId());
            if (appCatalog == null) {
                throw new IllegalArgumentException("应用不存在: " + dto.getAppId());
            }
            SolutionApp target = null;
            String dtoId = trimToNull(dto.getId());
            if (dtoId != null) {
                target = byId.get(dtoId);
            }
            if (target == null) {
                target = byAppId.get(dto.getAppId());
            }
            boolean isNew = target == null;
            if (isNew) {
                target = new SolutionApp();
                target.setSolutionId(solutionId);
                target.setCreateTime(now);
            }
            target.setAppId(appCatalog.getId());
            target.setSortNo(dto.getSortNo() == null ? index : dto.getSortNo());
            target.setDeployStatus(normalizeDeployStatus(dto.getDeployStatus(), "TODO"));
            target.setInstallRequired(dto.getInstallRequired() == null ? Boolean.TRUE : dto.getInstallRequired());
            target.setRemark(trimToNull(dto.getRemark()));
            target.setUpdateTime(now);
            if (isNew) {
                solutionAppMapper.insert(target);
            } else {
                solutionAppMapper.updateById(target);
            }
            keepIds.add(target.getId());
            index++;
        }

        List<SolutionApp> removedApps = existingApps.stream()
                .filter(item -> !keepIds.contains(item.getId()))
                .toList();
        deleteAppsAndConfigs(removedApps);

        solution.setUpdateTime(LocalDateTime.now());
        solutionMapper.updateById(solution);
        return buildDetail(solution);
    }

    @Transactional
    public SolutionDetailVO updateAppConfigs(String solutionId,
                                             String solutionAppId,
                                             List<SolutionAppConfigDTO> items) {
        Solution solution = requireSolution(solutionId);
        SolutionApp solutionApp = solutionAppMapper.selectById(solutionAppId);
        if (solutionApp == null || !Objects.equals(solutionApp.getSolutionId(), solutionId)) {
            throw new IllegalArgumentException("方案应用不存在: " + solutionAppId);
        }

        List<SolutionAppConfigDTO> payload = items == null ? List.of() : items;
        assertDistinctConfigKeys(payload);

        solutionAppConfigMapper.delete(new LambdaQueryWrapper<SolutionAppConfig>()
                .eq(SolutionAppConfig::getSolutionAppId, solutionAppId));

        LocalDateTime now = LocalDateTime.now();
        int index = 1;
        for (SolutionAppConfigDTO dto : payload) {
            String key = trimToNull(dto.getConfigKey());
            if (key == null) {
                throw new IllegalArgumentException("配置项 key 不能为空");
            }
            String name = trimToNull(dto.getConfigName());
            if (name == null) {
                throw new IllegalArgumentException("配置项名称不能为空");
            }
            SolutionAppConfig config = new SolutionAppConfig();
            config.setSolutionAppId(solutionAppId);
            config.setConfigKey(key);
            config.setConfigName(name);
            config.setValueType(normalizeValueType(dto.getValueType(), "STRING"));
            config.setRequired(Boolean.TRUE.equals(dto.getRequired()));
            config.setDefaultValue(trimToNull(dto.getDefaultValue()));
            config.setCurrentValue(trimToNull(dto.getCurrentValue()));
            config.setOptionsJson(trimToNull(dto.getOptionsJson()));
            config.setPlaceholder(trimToNull(dto.getPlaceholder()));
            config.setDescription(trimToNull(dto.getDescription()));
            config.setSortNo(dto.getSortNo() == null ? index : dto.getSortNo());
            config.setCreateTime(now);
            config.setUpdateTime(now);
            solutionAppConfigMapper.insert(config);
            index++;
        }

        solution.setUpdateTime(LocalDateTime.now());
        solutionMapper.updateById(solution);
        solutionApp.setUpdateTime(LocalDateTime.now());
        solutionAppMapper.updateById(solutionApp);
        return buildDetail(solution);
    }

    private Solution requireSolution(String id) {
        Solution solution = solutionMapper.selectById(id);
        if (solution == null) {
            throw new IllegalArgumentException("解决方案不存在: " + id);
        }
        return solution;
    }

    private Tenant requireTenant(String id) {
        String tenantId = trimToNull(id);
        if (tenantId == null) {
            throw new IllegalArgumentException("请选择租户");
        }
        Tenant tenant = tenantMapper.selectById(tenantId);
        if (tenant == null) {
            throw new IllegalArgumentException("租户不存在: " + tenantId);
        }
        return tenant;
    }

    private void validateCanActivate(Solution solution) {
        Tenant tenant = tenantMapper.selectById(solution.getTenantId());
        if (tenant == null || !"ACTIVE".equals(tenant.getStatus())) {
            throw new IllegalArgumentException("方案绑定租户不存在或未启用，不能激活");
        }

        List<SolutionApp> apps = solutionAppMapper.selectList(new LambdaQueryWrapper<SolutionApp>()
                .eq(SolutionApp::getSolutionId, solution.getId()));
        if (apps.isEmpty()) {
            throw new IllegalArgumentException("方案至少需要安装一个应用后才能激活");
        }

        List<SolutionAppConfig> configs = solutionAppConfigMapper.selectList(new LambdaQueryWrapper<SolutionAppConfig>()
                .in(SolutionAppConfig::getSolutionAppId, apps.stream().map(SolutionApp::getId).toList()));
        Map<String, List<SolutionAppConfig>> configMap = configs.stream()
                .collect(Collectors.groupingBy(SolutionAppConfig::getSolutionAppId));

        for (SolutionApp app : apps) {
            if (!Boolean.TRUE.equals(app.getInstallRequired())) {
                continue;
            }
            List<SolutionAppConfig> appConfigs = configMap.getOrDefault(app.getId(), List.of());
            for (SolutionAppConfig config : appConfigs) {
                if (!Boolean.TRUE.equals(config.getRequired())) {
                    continue;
                }
                String currentValue = trimToNull(config.getCurrentValue());
                if (currentValue == null) {
                    throw new IllegalArgumentException("应用缺少必填配置项值: " + config.getConfigName());
                }
            }
        }
    }

    private SolutionDetailVO buildDetail(Solution solution) {
        SolutionDetailVO detail = new SolutionDetailVO();
        detail.setId(solution.getId());
        detail.setSolutionCode(solution.getSolutionCode());
        detail.setName(solution.getName());
        detail.setTenantId(solution.getTenantId());
        detail.setDescription(solution.getDescription());
        detail.setStatus(solution.getStatus());
        detail.setOwner(solution.getOwner());
        detail.setGoLiveDate(solution.getGoLiveDate());
        detail.setCreateTime(solution.getCreateTime());
        detail.setUpdateTime(solution.getUpdateTime());

        Tenant tenant = tenantMapper.selectById(solution.getTenantId());
        detail.setTenantName(tenant != null ? tenant.getName() : null);

        List<SolutionApp> solutionApps = solutionAppMapper.selectList(new LambdaQueryWrapper<SolutionApp>()
                .eq(SolutionApp::getSolutionId, solution.getId())
                .orderByAsc(SolutionApp::getSortNo)
                .orderByAsc(SolutionApp::getCreateTime));
        if (solutionApps.isEmpty()) {
            return detail;
        }

        Map<String, AppCatalog> appCatalogMap = fetchAppCatalogMap(solutionApps.stream()
                .map(SolutionApp::getAppId)
                .collect(Collectors.toSet()));
        List<SolutionAppConfig> configs = solutionAppConfigMapper.selectList(new LambdaQueryWrapper<SolutionAppConfig>()
                .in(SolutionAppConfig::getSolutionAppId, solutionApps.stream().map(SolutionApp::getId).toList())
                .orderByAsc(SolutionAppConfig::getSortNo)
                .orderByAsc(SolutionAppConfig::getCreateTime));
        Map<String, List<SolutionAppConfig>> configMap = configs.stream()
                .collect(Collectors.groupingBy(SolutionAppConfig::getSolutionAppId, LinkedHashMap::new, Collectors.toList()));

        List<SolutionInstalledAppVO> installedApps = new ArrayList<>();
        for (SolutionApp app : solutionApps) {
            AppCatalog catalog = appCatalogMap.get(app.getAppId());
            SolutionInstalledAppVO item = new SolutionInstalledAppVO();
            item.setId(app.getId());
            item.setAppId(app.getAppId());
            item.setAppCode(catalog != null ? catalog.getAppCode() : null);
            item.setAppName(catalog != null ? catalog.getName() : "已删除应用");
            item.setCategory(catalog != null ? catalog.getCategory() : null);
            item.setDescription(catalog != null ? catalog.getDescription() : null);
            item.setIcon(catalog != null ? catalog.getIcon() : null);
            item.setSortNo(app.getSortNo());
            item.setDeployStatus(app.getDeployStatus());
            item.setInstallRequired(app.getInstallRequired());
            item.setRemark(app.getRemark());

            List<SolutionAppConfigVO> configVos = configMap.getOrDefault(app.getId(), List.of()).stream()
                    .sorted(Comparator.comparing(SolutionAppConfig::getSortNo, Comparator.nullsLast(Integer::compareTo))
                            .thenComparing(SolutionAppConfig::getCreateTime, Comparator.nullsLast(LocalDateTime::compareTo)))
                    .map(this::toConfigVO)
                    .collect(Collectors.toList());
            item.setConfigs(configVos);
            installedApps.add(item);
        }
        detail.setInstalledApps(installedApps);
        return detail;
    }

    private SolutionAppConfigVO toConfigVO(SolutionAppConfig config) {
        SolutionAppConfigVO vo = new SolutionAppConfigVO();
        vo.setId(config.getId());
        vo.setConfigKey(config.getConfigKey());
        vo.setConfigName(config.getConfigName());
        vo.setValueType(config.getValueType());
        vo.setRequired(config.getRequired());
        vo.setDefaultValue(config.getDefaultValue());
        vo.setCurrentValue(config.getCurrentValue());
        vo.setOptionsJson(config.getOptionsJson());
        vo.setPlaceholder(config.getPlaceholder());
        vo.setDescription(config.getDescription());
        vo.setSortNo(config.getSortNo());
        return vo;
    }

    private void assertTenantUnbound(String tenantId, String ignoreSolutionId) {
        LambdaQueryWrapper<Solution> wrapper = new LambdaQueryWrapper<Solution>()
                .eq(Solution::getTenantId, tenantId);
        if (ignoreSolutionId != null) {
            wrapper.ne(Solution::getId, ignoreSolutionId);
        }
        Long count = solutionMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw new IllegalArgumentException("该租户已绑定其他解决方案");
        }
    }

    private void assertUniqueCode(String code, String ignoreId) {
        LambdaQueryWrapper<Solution> wrapper = new LambdaQueryWrapper<Solution>()
                .eq(Solution::getSolutionCode, code);
        if (ignoreId != null) {
            wrapper.ne(Solution::getId, ignoreId);
        }
        Long count = solutionMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw new IllegalArgumentException("方案编码已存在: " + code);
        }
    }

    private String generateUniqueCode(String prefix) {
        for (int i = 0; i < 10; i++) {
            String code = generateCode(prefix);
            Long count = solutionMapper.selectCount(new LambdaQueryWrapper<Solution>()
                    .eq(Solution::getSolutionCode, code));
            if (count == null || count == 0) {
                return code;
            }
        }
        throw new IllegalStateException("生成方案编码失败，请重试");
    }

    private void assertDistinctAppIds(List<SolutionAppDTO> items) {
        Set<String> seen = new HashSet<>();
        for (SolutionAppDTO item : items) {
            String appId = trimToNull(item.getAppId());
            if (appId == null) {
                throw new IllegalArgumentException("安装应用不能为空");
            }
            if (!seen.add(appId)) {
                throw new IllegalArgumentException("同一方案不能重复安装同一应用");
            }
        }
    }

    private void assertDistinctConfigKeys(List<SolutionAppConfigDTO> items) {
        Set<String> seen = new HashSet<>();
        for (SolutionAppConfigDTO item : items) {
            String key = trimToNull(item.getConfigKey());
            if (key == null) {
                throw new IllegalArgumentException("配置项 key 不能为空");
            }
            if (!seen.add(key)) {
                throw new IllegalArgumentException("同一应用内配置项 key 不能重复: " + key);
            }
        }
    }

    private Map<String, AppCatalog> fetchAppCatalogMap(Collection<String> appIds) {
        Set<String> ids = appIds == null ? Set.of() : appIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return appCatalogMapper.selectBatchIds(ids).stream()
                .collect(Collectors.toMap(AppCatalog::getId, item -> item));
    }

    private void deleteAppsAndConfigs(List<SolutionApp> apps) {
        if (apps == null || apps.isEmpty()) {
            return;
        }
        List<String> ids = apps.stream().map(SolutionApp::getId).toList();
        solutionAppConfigMapper.delete(new LambdaQueryWrapper<SolutionAppConfig>()
                .in(SolutionAppConfig::getSolutionAppId, ids));
        for (String id : ids) {
            solutionAppMapper.deleteById(id);
        }
    }

    private String normalizeStatus(String status, String defaultStatus) {
        String normalized = trimToNull(status);
        if (normalized == null) {
            return defaultStatus;
        }
        if (!Set.of("DRAFT", "ACTIVE", "DISABLED").contains(normalized)) {
            throw new IllegalArgumentException("方案状态不合法: " + normalized);
        }
        return normalized;
    }

    private String normalizeDeployStatus(String status, String defaultStatus) {
        String normalized = trimToNull(status);
        if (normalized == null) {
            return defaultStatus;
        }
        if (!Set.of("TODO", "IN_PROGRESS", "DONE", "BLOCKED").contains(normalized)) {
            throw new IllegalArgumentException("部署状态不合法: " + normalized);
        }
        return normalized;
    }

    private String normalizeValueType(String valueType, String defaultType) {
        String normalized = trimToNull(valueType);
        if (normalized == null) {
            return defaultType;
        }
        if (!Set.of("STRING", "NUMBER", "BOOLEAN", "SELECT", "PASSWORD", "URL", "JSON").contains(normalized)) {
            throw new IllegalArgumentException("配置项类型不合法: " + normalized);
        }
        return normalized;
    }
}
