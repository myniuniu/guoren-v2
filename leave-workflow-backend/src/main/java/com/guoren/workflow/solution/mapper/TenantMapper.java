package com.guoren.workflow.solution.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guoren.workflow.solution.entity.Tenant;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TenantMapper extends BaseMapper<Tenant> {
}
