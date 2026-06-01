package com.guoren.workflow.dms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * DMS 文档-标签关联（联合主键表，documentId 上标 @TableId(INPUT) 以兼容 MP insert；
 * 读写均走 LambdaQueryWrapper，不使用 selectById / deleteById。
 */
@Data
@TableName("dms_doc_tag")
public class DmsDocTag {

    @TableId(type = IdType.INPUT)
    private String documentId;

    private String tagId;
}
