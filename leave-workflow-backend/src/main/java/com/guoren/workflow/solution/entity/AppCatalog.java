package com.guoren.workflow.solution.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 可安装应用目录
 */
@Data
@TableName("app_catalog")
public class AppCatalog {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String appCode;

    private String name;

    private String category;

    private String description;

    private String icon;

    /** ACTIVE / DISABLED */
    private String status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
