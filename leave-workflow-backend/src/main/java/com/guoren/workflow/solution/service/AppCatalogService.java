package com.guoren.workflow.solution.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guoren.workflow.solution.dto.AppCatalogDTO;
import com.guoren.workflow.solution.entity.AppCatalog;
import com.guoren.workflow.solution.entity.SolutionApp;
import com.guoren.workflow.solution.mapper.AppCatalogMapper;
import com.guoren.workflow.solution.mapper.SolutionAppMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import static com.guoren.workflow.solution.service.SolutionModuleSupport.generateCode;
import static com.guoren.workflow.solution.service.SolutionModuleSupport.trimToNull;

/**
 * 应用目录管理服务
 */
@Service
@RequiredArgsConstructor
public class AppCatalogService {

    private final AppCatalogMapper appCatalogMapper;
    private final SolutionAppMapper solutionAppMapper;

    public List<AppCatalog> list(String keyword, String status) {
        LambdaQueryWrapper<AppCatalog> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(AppCatalog::getUpdateTime).orderByDesc(AppCatalog::getCreateTime);
        String kw = trimToNull(keyword);
        if (kw != null) {
            wrapper.and(q -> q.like(AppCatalog::getName, kw).or().like(AppCatalog::getAppCode, kw));
        }
        String normalizedStatus = trimToNull(status);
        if (normalizedStatus != null) {
            wrapper.eq(AppCatalog::getStatus, normalizedStatus);
        }
        return appCatalogMapper.selectList(wrapper);
    }

    public AppCatalog detail(String id) {
        AppCatalog app = appCatalogMapper.selectById(id);
        if (app == null) {
            throw new IllegalArgumentException("应用目录不存在: " + id);
        }
        return app;
    }

    @Transactional
    public AppCatalog create(AppCatalogDTO dto) {
        String name = trimToNull(dto.getName());
        if (name == null) {
            throw new IllegalArgumentException("应用名称不能为空");
        }
        String code = trimToNull(dto.getAppCode());
        if (code == null) {
            code = generateUniqueCode("APP");
        } else {
            assertUniqueCode(code, null);
        }
        LocalDateTime now = LocalDateTime.now();
        AppCatalog app = new AppCatalog();
        app.setAppCode(code);
        app.setName(name);
        app.setCategory(trimToNull(dto.getCategory()));
        app.setDescription(trimToNull(dto.getDescription()));
        app.setIcon(trimToNull(dto.getIcon()));
        app.setStatus(normalizeStatus(dto.getStatus(), "ACTIVE"));
        app.setCreateTime(now);
        app.setUpdateTime(now);
        appCatalogMapper.insert(app);
        return app;
    }

    @Transactional
    public AppCatalog update(String id, AppCatalogDTO dto) {
        AppCatalog app = detail(id);
        String code = trimToNull(dto.getAppCode());
        if (code != null && !Objects.equals(code, app.getAppCode())) {
            assertUniqueCode(code, id);
            app.setAppCode(code);
        }
        String name = trimToNull(dto.getName());
        if (name != null) {
            app.setName(name);
        }
        if (dto.getCategory() != null) {
            app.setCategory(trimToNull(dto.getCategory()));
        }
        if (dto.getDescription() != null) {
            app.setDescription(trimToNull(dto.getDescription()));
        }
        if (dto.getIcon() != null) {
            app.setIcon(trimToNull(dto.getIcon()));
        }
        if (trimToNull(dto.getStatus()) != null) {
            app.setStatus(normalizeStatus(dto.getStatus(), app.getStatus()));
        }
        app.setUpdateTime(LocalDateTime.now());
        appCatalogMapper.updateById(app);
        return app;
    }

    @Transactional
    public void remove(String id) {
        detail(id);
        Long bindCount = solutionAppMapper.selectCount(new LambdaQueryWrapper<SolutionApp>()
                .eq(SolutionApp::getAppId, id));
        if (bindCount != null && bindCount > 0) {
            throw new IllegalArgumentException("该应用已被解决方案引用，不能删除");
        }
        appCatalogMapper.deleteById(id);
    }

    private void assertUniqueCode(String code, String ignoreId) {
        LambdaQueryWrapper<AppCatalog> wrapper = new LambdaQueryWrapper<AppCatalog>()
                .eq(AppCatalog::getAppCode, code);
        if (ignoreId != null) {
            wrapper.ne(AppCatalog::getId, ignoreId);
        }
        Long count = appCatalogMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw new IllegalArgumentException("应用编码已存在: " + code);
        }
    }

    private String generateUniqueCode(String prefix) {
        for (int i = 0; i < 10; i++) {
            String code = generateCode(prefix);
            Long count = appCatalogMapper.selectCount(new LambdaQueryWrapper<AppCatalog>()
                    .eq(AppCatalog::getAppCode, code));
            if (count == null || count == 0) {
                return code;
            }
        }
        throw new IllegalStateException("生成应用编码失败，请重试");
    }

    private String normalizeStatus(String status, String defaultStatus) {
        String normalized = trimToNull(status);
        if (normalized == null) {
            return defaultStatus;
        }
        if (!"ACTIVE".equals(normalized) && !"DISABLED".equals(normalized)) {
            throw new IllegalArgumentException("应用状态不合法: " + normalized);
        }
        return normalized;
    }
}
