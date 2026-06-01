package com.guoren.workflow.dms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guoren.workflow.dms.entity.DmsDocTag;
import com.guoren.workflow.dms.entity.DmsTag;
import com.guoren.workflow.dms.mapper.DmsDocTagMapper;
import com.guoren.workflow.dms.mapper.DmsTagMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * DMS 标签字典与文档标签关联同步服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DmsTagService {

    private final DmsTagMapper tagMapper;
    private final DmsDocTagMapper docTagMapper;

    /**
     * 列出全部标签，可按使用频次倒序
     */
    public List<Map<String, Object>> listAll(String orderBy) {
        LambdaQueryWrapper<DmsTag> w = new LambdaQueryWrapper<>();
        if ("usage".equalsIgnoreCase(orderBy)) {
            w.orderByDesc(DmsTag::getUsageCount).orderByAsc(DmsTag::getName);
        } else {
            w.orderByAsc(DmsTag::getName);
        }
        List<DmsTag> all = tagMapper.selectList(w);
        List<Map<String, Object>> ret = new ArrayList<>();
        for (DmsTag t : all) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("name", t.getName());
            m.put("color", t.getColor());
            m.put("usageCount", t.getUsageCount() == null ? 0 : t.getUsageCount());
            ret.add(m);
        }
        return ret;
    }

    /**
     * 按名称获取标签 id；不存在则创建
     */
    @Transactional
    public DmsTag upsertByName(String name) {
        if (name == null) return null;
        String n = name.trim();
        if (n.isEmpty()) return null;

        DmsTag exist = tagMapper.selectOne(new LambdaQueryWrapper<DmsTag>()
                .eq(DmsTag::getName, n).last("LIMIT 1"));
        if (exist != null) return exist;

        DmsTag t = new DmsTag();
        t.setName(n);
        t.setUsageCount(0);
        t.setCreateTime(LocalDateTime.now());
        tagMapper.insert(t);
        return t;
    }

    /**
     * 同步某文档的标签集合：替换中间表 + 维护 usage_count
     *
     * @param docId    文档 id
     * @param tagNames 新标签名称列表（不含重复）
     * @return 规范化后的逗号字符串（用于回写主表 tags 字段）
     */
    @Transactional
    public String syncForDoc(String docId, List<String> tagNames) {
        if (docId == null) return "";

        // 1. 取旧关联
        List<DmsDocTag> oldLinks = docTagMapper.selectList(new LambdaQueryWrapper<DmsDocTag>()
                .eq(DmsDocTag::getDocumentId, docId));
        Set<String> oldTagIds = new LinkedHashSet<>();
        for (DmsDocTag l : oldLinks) oldTagIds.add(l.getTagId());

        // 2. 规范化新标签：去空、去重（保序）
        Set<String> normNames = new LinkedHashSet<>();
        if (tagNames != null) {
            for (String t : tagNames) {
                if (t == null) continue;
                String s = t.trim();
                if (!s.isEmpty()) normNames.add(s);
            }
        }

        // 3. 新名转 tagId（缺失则新建）
        Set<String> newTagIds = new LinkedHashSet<>();
        List<String> orderedNames = new ArrayList<>();
        for (String name : normNames) {
            DmsTag tag = upsertByName(name);
            if (tag != null) {
                newTagIds.add(tag.getId());
                orderedNames.add(tag.getName());
            }
        }

        // 4. 差集 -> 计算新增 / 移除
        Set<String> toAdd = new HashSet<>(newTagIds);
        toAdd.removeAll(oldTagIds);
        Set<String> toRemove = new HashSet<>(oldTagIds);
        toRemove.removeAll(newTagIds);

        // 5. 应用差异：先删，再加
        if (!toRemove.isEmpty()) {
            docTagMapper.delete(new LambdaQueryWrapper<DmsDocTag>()
                    .eq(DmsDocTag::getDocumentId, docId)
                    .in(DmsDocTag::getTagId, toRemove));
            // usage_count -1
            for (String tid : toRemove) {
                adjustUsage(tid, -1);
            }
        }
        for (String tid : toAdd) {
            DmsDocTag link = new DmsDocTag();
            link.setDocumentId(docId);
            link.setTagId(tid);
            docTagMapper.insert(link);
            adjustUsage(tid, 1);
        }

        return String.join(",", orderedNames);
    }

    /**
     * 解除某文档的所有标签关联（删除文档时调用）
     */
    @Transactional
    public void clearForDoc(String docId) {
        syncForDoc(docId, Collections.emptyList());
    }

    /**
     * 按标签名查询关联的文档 id 集合
     */
    public Set<String> findDocIdsByTagName(String tagName) {
        if (tagName == null || tagName.isBlank()) return Collections.emptySet();
        DmsTag tag = tagMapper.selectOne(new LambdaQueryWrapper<DmsTag>()
                .eq(DmsTag::getName, tagName.trim()).last("LIMIT 1"));
        if (tag == null) return Collections.emptySet();
        List<DmsDocTag> links = docTagMapper.selectList(new LambdaQueryWrapper<DmsDocTag>()
                .eq(DmsDocTag::getTagId, tag.getId()));
        Set<String> ret = new HashSet<>();
        for (DmsDocTag l : links) ret.add(l.getDocumentId());
        return ret;
    }

    private void adjustUsage(String tagId, int delta) {
        DmsTag t = tagMapper.selectById(tagId);
        if (t == null) return;
        int cur = t.getUsageCount() == null ? 0 : t.getUsageCount();
        t.setUsageCount(Math.max(0, cur + delta));
        tagMapper.updateById(t);
    }
}
