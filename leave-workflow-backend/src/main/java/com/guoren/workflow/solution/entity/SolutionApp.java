package com.guoren.workflow.solution.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 解决方案安装应用清单
 */
@Data
@TableName("solution_app")
public class SolutionApp {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String solutionId;

    private String appId;

    private Integer sortNo;

    /** TODO / IN_PROGRESS / DONE / BLOCKED */
    private String deployStatus;

    private Boolean installRequired;

    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
