package com.guoren.workflow.dms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DMS 分类（树形）
 */
@Data
@TableName("dms_category")
public class DmsCategory {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String parentId;

    private String name;

    private Integer sortNo;

    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
