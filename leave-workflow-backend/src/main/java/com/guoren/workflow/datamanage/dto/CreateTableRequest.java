package com.guoren.workflow.datamanage.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateTableRequest {
    /** 表名（必填） */
    private String name;
    /** 表注释 */
    private String comment;
    /** 字段定义列表 */
    private List<ColumnInfo> columns = new ArrayList<>();
}
