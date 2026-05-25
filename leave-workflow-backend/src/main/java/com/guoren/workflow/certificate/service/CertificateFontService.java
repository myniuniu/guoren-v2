package com.guoren.workflow.certificate.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.GraphicsEnvironment;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 字体校验服务（C1/C2）
 */
@Slf4j
@Service
public class CertificateFontService {

    private volatile Set<String> cache;

    /**
     * 逻辑可用字体白名单：即使 Java AWT 字体列表中未查到，也视为可用。
     * 原因：Java 渲染时对于不存在的字体会自动 fallback 到系统默认字体，
     * 这里避免给用户报各种无所谓的“字体缺失”警告。
     */
    private static final Set<String> LOGICAL_AVAILABLE = new HashSet<>(java.util.Arrays.asList(
            "Microsoft YaHei", "PingFang SC", "SimSun", "SimHei", "KaiTi", "FangSong",
            "Noto Sans CJK SC", "Source Han Sans CN", "STKaiti", "STSong",
            "Arial", "Times New Roman", "Helvetica", "Georgia"
    ));

    private synchronized Set<String> available() {
        if (cache == null) {
            String[] arr = GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames();
            Set<String> set = new HashSet<>(arr.length);
            for (String n : arr) set.add(n);
            cache = set;
        }
        return cache;
    }

    private boolean isAvailable(String name) {
        if (name == null || name.isBlank()) return true;
        return available().contains(name) || LOGICAL_AVAILABLE.contains(name);
    }

    /** 推荐的证书常用字体（按可用性返回） */
    public List<Map<String, Object>> listRecommended() {
        String[] preferred = {
                "Microsoft YaHei", "PingFang SC", "SimSun", "SimHei", "KaiTi", "FangSong",
                "Noto Sans CJK SC", "Source Han Sans CN", "STKaiti", "STSong",
                "Arial", "Times New Roman", "Helvetica", "Georgia"
        };
        List<Map<String, Object>> ret = new ArrayList<>(preferred.length);
        for (String name : preferred) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", name);
            m.put("available", isAvailable(name));
            ret.add(m);
        }
        return ret;
    }

    /** 检查指定字体是否在系统中可用 */
    public Map<String, Object> check(List<String> fonts) {
        List<String> missing = new ArrayList<>();
        if (fonts != null) {
            for (String f : fonts) {
                if (f == null || f.isBlank()) continue;
                if (!isAvailable(f)) missing.add(f);
            }
        }
        Map<String, Object> ret = new LinkedHashMap<>();
        ret.put("missing", missing);
        ret.put("ok", missing.isEmpty());
        return ret;
    }
}
