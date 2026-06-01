package com.guoren.workflow.dms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DMS 标签字典
 */
@Data
@TableName("dms_tag")
public class DmsTag {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String name;

    private String color;

    private Integer usageCount;

    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
