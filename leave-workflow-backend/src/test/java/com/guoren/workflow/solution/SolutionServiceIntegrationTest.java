package com.guoren.workflow.solution;

import com.guoren.workflow.solution.dto.AppCatalogDTO;
import com.guoren.workflow.solution.dto.SolutionAppConfigDTO;
import com.guoren.workflow.solution.dto.SolutionAppDTO;
import com.guoren.workflow.solution.dto.SolutionDTO;
import com.guoren.workflow.solution.dto.TenantDTO;
import com.guoren.workflow.solution.entity.AppCatalog;
import com.guoren.workflow.solution.entity.Tenant;
import com.guoren.workflow.solution.service.AppCatalogService;
import com.guoren.workflow.solution.service.SolutionService;
import com.guoren.workflow.solution.service.TenantService;
import com.guoren.workflow.solution.vo.SolutionDetailVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class SolutionServiceIntegrationTest {

    @Autowired
    private TenantService tenantService;

    @Autowired
    private AppCatalogService appCatalogService;

    @Autowired
    private SolutionService solutionService;

    @Test
    void shouldEnforceOneTenantOneSolutionBinding() {
        Tenant tenant = createTenant("华东示范租户");

        SolutionDetailVO first = solutionService.create(solutionDto(tenant.getId(), "协同办公方案"));

        assertThat(first.getTenantId()).isEqualTo(tenant.getId());
        assertThat(first.getStatus()).isEqualTo("DRAFT");

        assertThatThrownBy(() -> solutionService.create(solutionDto(tenant.getId(), "第二套方案")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("已绑定其他解决方案");
    }

    @Test
    void shouldRejectActivationWhenRequiredConfigMissing() {
        Tenant tenant = createTenant("激活校验租户");
        AppCatalog app = createApp("文档管理");
        SolutionDetailVO solution = solutionService.create(solutionDto(tenant.getId(), "企业文档方案"));

        SolutionAppDTO appDto = new SolutionAppDTO();
        appDto.setAppId(app.getId());
        appDto.setInstallRequired(true);
        appDto.setDeployStatus("TODO");
        solutionService.updateApps(solution.getId(), List.of(appDto));

        SolutionDetailVO detail = solutionService.detail(solution.getId());
        String solutionAppId = detail.getInstalledApps().get(0).getId();

        SolutionAppConfigDTO config = new SolutionAppConfigDTO();
        config.setConfigKey("endpoint");
        config.setConfigName("服务地址");
        config.setValueType("URL");
        config.setRequired(true);
        solutionService.updateAppConfigs(solution.getId(), solutionAppId, List.of(config));

        SolutionDTO activateDto = new SolutionDTO();
        activateDto.setStatus("ACTIVE");
        assertThatThrownBy(() -> solutionService.update(solution.getId(), activateDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("缺少必填配置项值");
    }

    @Test
    void shouldActivateAfterRequiredConfigProvided() {
        Tenant tenant = createTenant("生产租户");
        AppCatalog app = createApp("三方集成");
        SolutionDetailVO solution = solutionService.create(solutionDto(tenant.getId(), "生产交付方案"));

        SolutionAppDTO appDto = new SolutionAppDTO();
        appDto.setAppId(app.getId());
        appDto.setInstallRequired(true);
        appDto.setDeployStatus("IN_PROGRESS");
        SolutionDetailVO afterApps = solutionService.updateApps(solution.getId(), List.of(appDto));
        String solutionAppId = afterApps.getInstalledApps().get(0).getId();

        SolutionAppConfigDTO config = new SolutionAppConfigDTO();
        config.setConfigKey("client_id");
        config.setConfigName("Client ID");
        config.setValueType("STRING");
        config.setRequired(true);
        config.setCurrentValue("demo-client");
        solutionService.updateAppConfigs(solution.getId(), solutionAppId, List.of(config));

        SolutionDTO activateDto = new SolutionDTO();
        activateDto.setStatus("ACTIVE");
        SolutionDetailVO activated = solutionService.update(solution.getId(), activateDto);

        assertThat(activated.getStatus()).isEqualTo("ACTIVE");
        assertThat(activated.getInstalledApps()).hasSize(1);
        assertThat(activated.getInstalledApps().get(0).getConfigs().get(0).getCurrentValue())
                .isEqualTo("demo-client");
    }

    @Test
    void shouldPreventDeletingBoundTenantAndReferencedApp() {
        Tenant tenant = createTenant("受保护租户");
        AppCatalog app = createApp("流程审批");
        SolutionDetailVO solution = solutionService.create(solutionDto(tenant.getId(), "流程交付方案"));

        SolutionAppDTO appDto = new SolutionAppDTO();
        appDto.setAppId(app.getId());
        solutionService.updateApps(solution.getId(), List.of(appDto));

        assertThatThrownBy(() -> tenantService.remove(tenant.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("已绑定解决方案");

        assertThatThrownBy(() -> appCatalogService.remove(app.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("已被解决方案引用");
    }

    private Tenant createTenant(String name) {
        TenantDTO dto = new TenantDTO();
        dto.setName(name);
        dto.setStatus("ACTIVE");
        return tenantService.create(dto);
    }

    private AppCatalog createApp(String name) {
        AppCatalogDTO dto = new AppCatalogDTO();
        dto.setName(name);
        dto.setCategory("业务应用");
        dto.setStatus("ACTIVE");
        return appCatalogService.create(dto);
    }

    private SolutionDTO solutionDto(String tenantId, String name) {
        SolutionDTO dto = new SolutionDTO();
        dto.setTenantId(tenantId);
        dto.setName(name);
        return dto;
    }
}
