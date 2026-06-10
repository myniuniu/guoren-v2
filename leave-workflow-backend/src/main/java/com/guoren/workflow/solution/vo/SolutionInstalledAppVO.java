package com.guoren.workflow.solution.vo;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 方案已安装应用视图
 */
@Data
public class SolutionInstalledAppVO {

    private String id;

    private String appId;

    private String appCode;

    private String appName;

    private String category;

    private String description;

    private String icon;

    private Integer sortNo;

    private String deployStatus;

    private Boolean installRequired;

    private String remark;

    private List<SolutionAppConfigVO> configs = new ArrayList<>();
}
