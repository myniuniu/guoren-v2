package com.guoren.workflow.solution.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 租户主数据
 */
@Data
@TableName("tenant")
public class Tenant {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String tenantCode;

    private String name;

    private String contactName;

    private String contactPhone;

    private String industry;

    /** ACTIVE / DISABLED */
    private String status;

    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
