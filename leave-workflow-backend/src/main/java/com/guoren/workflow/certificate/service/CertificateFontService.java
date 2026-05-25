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

    private synchronized Set<String> available() {
        if (cache == null) {
            String[] arr = GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames();
            Set<String> set = new HashSet<>(arr.length);
            for (String n : arr) set.add(n);
            cache = set;
        }
        return cache;
    }

    /** 推荐的证书常用字体（按可用性返回） */
    public List<Map<String, Object>> listRecommended() {
        String[] preferred = {
                "Microsoft YaHei", "PingFang SC", "SimSun", "SimHei", "KaiTi", "FangSong",
                "Noto Sans CJK SC", "Source Han Sans CN", "STKaiti", "STSong",
                "Arial", "Times New Roman", "Helvetica", "Georgia"
        };
        Set<String> avail = available();
        List<Map<String, Object>> ret = new ArrayList<>(preferred.length);
        for (String name : preferred) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", name);
            m.put("available", avail.contains(name));
            ret.add(m);
        }
        return ret;
    }

    /** 检查指定字体是否在系统中可用 */
    public Map<String, Object> check(List<String> fonts) {
        Set<String> avail = available();
        List<String> missing = new ArrayList<>();
        if (fonts != null) {
            for (String f : fonts) {
                if (f == null || f.isBlank()) continue;
                if (!avail.contains(f)) missing.add(f);
            }
        }
        Map<String, Object> ret = new LinkedHashMap<>();
        ret.put("missing", missing);
        ret.put("ok", missing.isEmpty());
        return ret;
    }
}
