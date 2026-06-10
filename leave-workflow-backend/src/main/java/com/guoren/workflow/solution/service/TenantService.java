package com.guoren.workflow.solution.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guoren.workflow.solution.dto.TenantDTO;
import com.guoren.workflow.solution.entity.Tenant;
import com.guoren.workflow.solution.mapper.SolutionMapper;
import com.guoren.workflow.solution.mapper.TenantMapper;
import com.guoren.workflow.solution.entity.Solution;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import static com.guoren.workflow.solution.service.SolutionModuleSupport.generateCode;
import static com.guoren.workflow.solution.service.SolutionModuleSupport.trimToNull;

/**
 * 租户管理服务
 */
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantMapper tenantMapper;
    private final SolutionMapper solutionMapper;

    public List<Tenant> list(String keyword, String status) {
        LambdaQueryWrapper<Tenant> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Tenant::getUpdateTime).orderByDesc(Tenant::getCreateTime);
        String kw = trimToNull(keyword);
        if (kw != null) {
            wrapper.and(q -> q.like(Tenant::getName, kw).or().like(Tenant::getTenantCode, kw));
        }
        String normalizedStatus = trimToNull(status);
        if (normalizedStatus != null) {
            wrapper.eq(Tenant::getStatus, normalizedStatus);
        }
        return tenantMapper.selectList(wrapper);
    }

    public Tenant detail(String id) {
        Tenant tenant = tenantMapper.selectById(id);
        if (tenant == null) {
            throw new IllegalArgumentException("租户不存在: " + id);
        }
        return tenant;
    }

    @Transactional
    public Tenant create(TenantDTO dto) {
        String name = trimToNull(dto.getName());
        if (name == null) {
            throw new IllegalArgumentException("租户名称不能为空");
        }
        String code = trimToNull(dto.getTenantCode());
        if (code == null) {
            code = generateUniqueCode("TENANT");
        } else {
            assertUniqueCode(code, null);
        }
        LocalDateTime now = LocalDateTime.now();
        Tenant tenant = new Tenant();
        tenant.setTenantCode(code);
        tenant.setName(name);
        tenant.setContactName(trimToNull(dto.getContactName()));
        tenant.setContactPhone(trimToNull(dto.getContactPhone()));
        tenant.setIndustry(trimToNull(dto.getIndustry()));
        tenant.setStatus(normalizeStatus(dto.getStatus(), "ACTIVE"));
        tenant.setRemark(trimToNull(dto.getRemark()));
        tenant.setCreateTime(now);
        tenant.setUpdateTime(now);
        tenantMapper.insert(tenant);
        return tenant;
    }

    @Transactional
    public Tenant update(String id, TenantDTO dto) {
        Tenant tenant = detail(id);
        String code = trimToNull(dto.getTenantCode());
        if (code != null && !Objects.equals(code, tenant.getTenantCode())) {
            assertUniqueCode(code, id);
            tenant.setTenantCode(code);
        }
        String name = trimToNull(dto.getName());
        if (name != null) {
            tenant.setName(name);
        }
        if (dto.getContactName() != null) {
            tenant.setContactName(trimToNull(dto.getContactName()));
        }
        if (dto.getContactPhone() != null) {
            tenant.setContactPhone(trimToNull(dto.getContactPhone()));
        }
        if (dto.getIndustry() != null) {
            tenant.setIndustry(trimToNull(dto.getIndustry()));
        }
        if (trimToNull(dto.getStatus()) != null) {
            tenant.setStatus(normalizeStatus(dto.getStatus(), tenant.getStatus()));
        }
        if (dto.getRemark() != null) {
            tenant.setRemark(trimToNull(dto.getRemark()));
        }
        tenant.setUpdateTime(LocalDateTime.now());
        tenantMapper.updateById(tenant);
        return tenant;
    }

    @Transactional
    public void remove(String id) {
        detail(id);
        Long bindCount = solutionMapper.selectCount(new LambdaQueryWrapper<Solution>()
                .eq(Solution::getTenantId, id));
        if (bindCount != null && bindCount > 0) {
            throw new IllegalArgumentException("该租户已绑定解决方案，不能删除");
        }
        tenantMapper.deleteById(id);
    }

    private void assertUniqueCode(String code, String ignoreId) {
        LambdaQueryWrapper<Tenant> wrapper = new LambdaQueryWrapper<Tenant>()
                .eq(Tenant::getTenantCode, code);
        if (ignoreId != null) {
            wrapper.ne(Tenant::getId, ignoreId);
        }
        Long count = tenantMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw new IllegalArgumentException("租户编码已存在: " + code);
        }
    }

    private String generateUniqueCode(String prefix) {
        for (int i = 0; i < 10; i++) {
            String code = generateCode(prefix);
            Long count = tenantMapper.selectCount(new LambdaQueryWrapper<Tenant>()
                    .eq(Tenant::getTenantCode, code));
            if (count == null || count == 0) {
                return code;
            }
        }
        throw new IllegalStateException("生成租户编码失败，请重试");
    }

    private String normalizeStatus(String status, String defaultStatus) {
        String normalized = trimToNull(status);
        if (normalized == null) {
            return defaultStatus;
        }
        if (!"ACTIVE".equals(normalized) && !"DISABLED".equals(normalized)) {
            throw new IllegalArgumentException("租户状态不合法: " + normalized);
        }
        return normalized;
    }
}
