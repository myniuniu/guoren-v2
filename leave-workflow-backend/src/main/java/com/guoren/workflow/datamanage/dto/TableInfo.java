package com.guoren.workflow.datamanage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TableInfo {
    /** 物理表名 */
    private String name;
    /** 表注释 */
    private String comment;
    /** 行数（可选） */
    private Long rowCount;
}
