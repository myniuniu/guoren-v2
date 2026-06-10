package com.guoren.workflow.solution.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 解决方案主表
 */
@Data
@TableName("solution")
public class Solution {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String solutionCode;

    private String name;

    private String tenantId;

    private String description;

    /** DRAFT / ACTIVE / DISABLED */
    private String status;

    private String owner;

    private LocalDate goLiveDate;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
