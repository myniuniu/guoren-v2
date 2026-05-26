package com.guoren.workflow.datamanage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ColumnInfo {
    /** 列名 */
    private String name;
    /** 字段类型（业务） */
    private String fieldType;
    /** 数据库类型（物理） */
    private String dbType;
    /** 列注释 */
    private String comment;
    /** 是否可空 */
    private Boolean nullable;
    /** 是否主键 */
    private Boolean primary;
    /** 是否唯一 */
    private Boolean unique;
    /** 是否多值（业务标记） */
    private Boolean multi;
    /** 默认值 */
    private String defaultValue;
    /** 长度 */
    private Integer length;
}
