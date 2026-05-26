package com.guoren.workflow.datamanage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RowsResponse {
    /** 总行数 */
    private long total;
    /** 当前页 */
    private int page;
    /** 每页大小 */
    private int pageSize;
    /** 行数据列表 */
    private List<Map<String, Object>> rows;
}
