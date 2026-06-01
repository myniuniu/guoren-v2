package com.guoren.workflow.dms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guoren.workflow.dms.dto.DmsCategoryDTO;
import com.guoren.workflow.dms.entity.DmsCategory;
import com.guoren.workflow.dms.entity.DmsDocument;
import com.guoren.workflow.dms.mapper.DmsCategoryMapper;
import com.guoren.workflow.dms.mapper.DmsDocumentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * DMS 分类树服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DmsCategoryService {

    private final DmsCategoryMapper mapper;
    private final DmsDocumentMapper documentMapper;

    @Transactional
    public DmsCategory create(DmsCategoryDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("分类名称不能为空");
        }
        DmsCategory c = new DmsCategory();
        c.setName(dto.getName().trim());
        c.setParentId(dto.getParentId());
        c.setSortNo(dto.getSortNo() == null ? 0 : dto.getSortNo());
        c.setCreateTime(LocalDateTime.now());
        mapper.insert(c);
        return c;
    }

    @Transactional
    public DmsCategory update(String id, DmsCategoryDTO dto) {
        DmsCategory c = mapper.selectById(id);
        if (c == null) {
            throw new IllegalArgumentException("分类不存在: " + id);
        }
        if (dto.getName() != null && !dto.getName().isBlank()) {
            c.setName(dto.getName().trim());
        }
        if (dto.getSortNo() != null) {
            c.setSortNo(dto.getSortNo());
        }
        mapper.updateById(c);
        return c;
    }

    /**
     * 移动分类到新的父节点（parentId 为 null 表示移到根）
     */
    @Transactional
    public DmsCategory move(String id, String newParentId) {
        DmsCategory c = mapper.selectById(id);
        if (c == null) {
            throw new IllegalArgumentException("分类不存在: " + id);
        }
        // 防止把自己挂到自己的子树下
        if (newParentId != null && !newParentId.isBlank()) {
            if (newParentId.equals(id)) {
                throw new IllegalArgumentException("不能移动到自身");
            }
            Set<String> descendants = collectDescendantIds(id);
            if (descendants.contains(newParentId)) {
                throw new IllegalArgumentException("不能移动到自身的子分类下");
            }
        }
        c.setParentId(newParentId);
        mapper.updateById(c);
        return c;
    }

    /**
     * 删除分类：要求该分类及其子分类下都没有文档
     */
    @Transactional
    public void remove(String id) {
        DmsCategory c = mapper.selectById(id);
        if (c == null) return;

        Set<String> all = new HashSet<>();
        all.add(id);
        all.addAll(collectDescendantIds(id));

        // 校验文档不为空
        LambdaQueryWrapper<DmsDocument> w = new LambdaQueryWrapper<>();
        w.in(DmsDocument::getCategoryId, all);
        Long docCount = documentMapper.selectCount(w);
        if (docCount != null && docCount > 0) {
            throw new IllegalArgumentException("分类（含子分类）下仍有 " + docCount + " 篇文档，不能删除");
        }

        // 软删自己 + 子孙
        for (String cid : all) {
            mapper.deleteById(cid);
        }
    }

    /**
     * 树结构 + 每个节点的 docCount（不含子节点的直接计数）
     */
    public List<Map<String, Object>> listTree() {
        List<DmsCategory> all = mapper.selectList(
                new LambdaQueryWrapper<DmsCategory>().orderByAsc(DmsCategory::getSortNo)
                        .orderByAsc(DmsCategory::getCreateTime));

        // 文档计数（一次扫描）
        Map<String, Integer> directCount = new LinkedHashMap<>();
        List<DmsDocument> docs = documentMapper.selectList(new LambdaQueryWrapper<DmsDocument>()
                .select(DmsDocument::getCategoryId));
        for (DmsDocument d : docs) {
            String cid = d.getCategoryId();
            if (cid == null) continue;
            directCount.merge(cid, 1, Integer::sum);
        }

        // 构建 id -> node 映射
        Map<String, Map<String, Object>> nodeMap = new LinkedHashMap<>();
        for (DmsCategory c : all) {
            Map<String, Object> n = new LinkedHashMap<>();
            n.put("id", c.getId());
            n.put("parentId", c.getParentId());
            n.put("name", c.getName());
            n.put("sortNo", c.getSortNo());
            n.put("docCount", directCount.getOrDefault(c.getId(), 0));
            n.put("children", new ArrayList<Map<String, Object>>());
            nodeMap.put(c.getId(), n);
        }
        List<Map<String, Object>> roots = new ArrayList<>();
        for (DmsCategory c : all) {
            Map<String, Object> node = nodeMap.get(c.getId());
            String pid = c.getParentId();
            if (pid == null || pid.isBlank() || !nodeMap.containsKey(pid)) {
                roots.add(node);
            } else {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children =
                        (List<Map<String, Object>>) nodeMap.get(pid).get("children");
                children.add(node);
            }
        }
        return roots;
    }

    /**
     * 收集某分类的所有后代 id（不含自身）
     */
    public Set<String> collectDescendantIds(String rootId) {
        Set<String> result = new HashSet<>();
        if (rootId == null || rootId.isBlank()) return result;

        // 拉全部分类一次（数据量小，简化实现）
        List<DmsCategory> all = mapper.selectList(null);
        Map<String, List<String>> childrenMap = new LinkedHashMap<>();
        for (DmsCategory c : all) {
            if (c.getParentId() == null) continue;
            childrenMap.computeIfAbsent(c.getParentId(), k -> new ArrayList<>()).add(c.getId());
        }

        // BFS
        java.util.Deque<String> stack = new java.util.ArrayDeque<>();
        List<String> direct = childrenMap.get(rootId);
        if (direct != null) stack.addAll(direct);
        while (!stack.isEmpty()) {
            String cur = stack.pop();
            if (!result.add(cur)) continue;
            List<String> next = childrenMap.get(cur);
            if (next != null) stack.addAll(next);
        }
        return result;
    }

    /**
     * 收集某分类自身 + 所有子孙 id（用于按分类含子节点的过滤）
     */
    public Set<String> collectSelfAndDescendantIds(String rootId) {
        Set<String> ret = new HashSet<>();
        if (rootId == null || rootId.isBlank()) return ret;
        ret.add(rootId);
        ret.addAll(collectDescendantIds(rootId));
        return ret;
    }
}
