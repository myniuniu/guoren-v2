package com.guoren.workflow.dms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guoren.workflow.dms.dto.DmsDocumentDTO;
import com.guoren.workflow.dms.dto.DmsDocumentQueryDTO;
import com.guoren.workflow.dms.entity.DmsDocument;
import com.guoren.workflow.dms.entity.DmsDocumentVersion;
import com.guoren.workflow.dms.mapper.DmsDocumentMapper;
import com.guoren.workflow.dms.mapper.DmsDocumentVersionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * DMS 文档服务（v2：含分类递归过滤、标签同步、版本快照与回滚、批量移动）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DmsDocumentService {

    private final DmsDocumentMapper mapper;
    private final DmsDocumentVersionMapper versionMapper;
    private final DmsCategoryService categoryService;
    private final DmsTagService tagService;

    // ---------------- CRUD ----------------

    @Transactional
    public DmsDocument create(DmsDocumentDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("文档标题不能为空");
        }
        DmsDocument d = new DmsDocument();
        d.setTitle(dto.getTitle());
        d.setCategoryId(dto.getCategoryId());
        d.setDocType(dto.getDocType());
        d.setDescription(dto.getDescription());
        d.setFileUrl(dto.getFileUrl());
        d.setFileName(dto.getFileName());
        d.setFileSize(dto.getFileSize());
        d.setMime(dto.getMime());
        d.setStatus("DRAFT");
        d.setLatestVersion(1);
        d.setCreateBy(dto.getCreateBy());
        d.setCreateDept(dto.getCreateDept());
        d.setCreateTime(LocalDateTime.now());
        d.setUpdateTime(LocalDateTime.now());
        d.setDocNo(generateDocNo());
        mapper.insert(d);

        // 标签同步（生成规范化字符串回写）
        String normalized = tagService.syncForDoc(d.getId(), parseTags(dto.getTags()));
        d.setTags(normalized);
        mapper.updateById(d);
        return d;
    }

    @Transactional
    public DmsDocument update(String id, DmsDocumentDTO dto) {
        DmsDocument d = mapper.selectById(id);
        if (d == null) {
            throw new IllegalArgumentException("文档不存在: " + id);
        }
        // 检测文件是否变化（fileUrl 不同 = 替换了主文件）
        boolean fileChanged = dto.getFileUrl() != null
                && !Objects.equals(dto.getFileUrl(), d.getFileUrl())
                && d.getFileUrl() != null && !d.getFileUrl().isBlank();

        if (fileChanged) {
            // 把旧的主文件归档为版本快照（versionNo 沿用原 latestVersion）
            DmsDocumentVersion v = new DmsDocumentVersion();
            v.setDocumentId(d.getId());
            v.setVersionNo(d.getLatestVersion() == null ? 1 : d.getLatestVersion());
            v.setFileUrl(d.getFileUrl());
            v.setFileName(d.getFileName());
            v.setFileSize(d.getFileSize());
            v.setMime(d.getMime());
            v.setChangeLog(dto.getChangeLog());
            v.setCreateBy(dto.getCreateBy() != null ? dto.getCreateBy() : d.getCreateBy());
            v.setCreateTime(LocalDateTime.now());
            versionMapper.insert(v);

            d.setLatestVersion((d.getLatestVersion() == null ? 1 : d.getLatestVersion()) + 1);
        }

        if (dto.getTitle() != null) d.setTitle(dto.getTitle());
        if (dto.getCategoryId() != null) d.setCategoryId(dto.getCategoryId());
        if (dto.getDocType() != null) d.setDocType(dto.getDocType());
        if (dto.getDescription() != null) d.setDescription(dto.getDescription());
        if (dto.getFileUrl() != null) d.setFileUrl(dto.getFileUrl());
        if (dto.getFileName() != null) d.setFileName(dto.getFileName());
        if (dto.getFileSize() != null) d.setFileSize(dto.getFileSize());
        if (dto.getMime() != null) d.setMime(dto.getMime());
        d.setUpdateTime(LocalDateTime.now());
        mapper.updateById(d);

        // 标签同步：dto.tags 为 null 表示「不修改」；为空字符串 / 空数组表示「清空」
        if (dto.getTags() != null) {
            String normalized = tagService.syncForDoc(d.getId(), parseTags(dto.getTags()));
            d.setTags(normalized);
            mapper.updateById(d);
        }
        return d;
    }

    @Transactional
    public void delete(String id) {
        // 先解除标签关联
        tagService.clearForDoc(id);
        mapper.deleteById(id);
    }

    @Transactional
    public int bulkMove(List<String> ids, String categoryId) {
        if (ids == null || ids.isEmpty()) return 0;
        int count = 0;
        for (String id : ids) {
            DmsDocument d = mapper.selectById(id);
            if (d == null) continue;
            d.setCategoryId(categoryId); // null 表示移到根
            d.setUpdateTime(LocalDateTime.now());
            mapper.updateById(d);
            count++;
        }
        return count;
    }

    // ---------------- Page / Detail ----------------

    public Map<String, Object> page(DmsDocumentQueryDTO q) {
        LambdaQueryWrapper<DmsDocument> w = new LambdaQueryWrapper<>();
        if (q.getKeyword() != null && !q.getKeyword().isBlank()) {
            String kw = q.getKeyword().trim();
            w.and(x -> x.like(DmsDocument::getTitle, kw)
                    .or().like(DmsDocument::getDocNo, kw)
                    .or().like(DmsDocument::getTags, kw));
        }
        if (q.getDocType() != null && !q.getDocType().isBlank()) {
            w.eq(DmsDocument::getDocType, q.getDocType());
        }
        if (q.getStatus() != null && !q.getStatus().isBlank()) {
            w.eq(DmsDocument::getStatus, q.getStatus());
        }
        if (q.getCategoryId() != null && !q.getCategoryId().isBlank()) {
            // 递归：包含选中分类 + 子孙
            Set<String> ids = categoryService.collectSelfAndDescendantIds(q.getCategoryId());
            if (ids.isEmpty()) {
                w.eq(DmsDocument::getCategoryId, q.getCategoryId());
            } else {
                w.in(DmsDocument::getCategoryId, ids);
            }
        }
        if (q.getTagName() != null && !q.getTagName().isBlank()) {
            Set<String> docIds = tagService.findDocIdsByTagName(q.getTagName());
            if (docIds.isEmpty()) {
                // 强制无结果
                w.eq(DmsDocument::getId, "__none__");
            } else {
                w.in(DmsDocument::getId, docIds);
            }
        }
        w.orderByDesc(DmsDocument::getUpdateTime);

        int page = q.getPage() == null || q.getPage() < 1 ? 1 : q.getPage();
        int size = q.getSize() == null || q.getSize() < 1 ? 10 : q.getSize();
        IPage<DmsDocument> p = mapper.selectPage(new Page<>(page, size), w);

        Map<String, Object> ret = new LinkedHashMap<>();
        ret.put("total", p.getTotal());
        ret.put("page", page);
        ret.put("size", size);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (DmsDocument r : p.getRecords()) {
            rows.add(toListVO(r));
        }
        ret.put("rows", rows);
        return ret;
    }

    public Map<String, Object> detail(String id) {
        DmsDocument d = mapper.selectById(id);
        if (d == null) return null;
        return toDetailVO(d);
    }

    // ---------------- Versions ----------------

    public List<Map<String, Object>> listVersions(String docId) {
        List<DmsDocumentVersion> versions = versionMapper.selectList(
                new LambdaQueryWrapper<DmsDocumentVersion>()
                        .eq(DmsDocumentVersion::getDocumentId, docId)
                        .orderByDesc(DmsDocumentVersion::getVersionNo));
        List<Map<String, Object>> ret = new ArrayList<>();
        for (DmsDocumentVersion v : versions) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", v.getId());
            m.put("versionNo", v.getVersionNo());
            m.put("fileUrl", v.getFileUrl());
            m.put("fileName", v.getFileName());
            m.put("fileSize", v.getFileSize());
            m.put("mime", v.getMime());
            m.put("changeLog", v.getChangeLog());
            m.put("createBy", v.getCreateBy());
            m.put("createTime", v.getCreateTime());
            ret.add(m);
        }
        return ret;
    }

    /**
     * 回滚到指定版本：把当前主文件归档为新版本，并将选中版本的 file* 回写到主表。
     * latestVersion += 1（保留所有历史可追溯）。
     */
    @Transactional
    public DmsDocument rollback(String docId, String versionId, String operator) {
        DmsDocument d = mapper.selectById(docId);
        if (d == null) throw new IllegalArgumentException("文档不存在: " + docId);

        DmsDocumentVersion target = versionMapper.selectById(versionId);
        if (target == null || !docId.equals(target.getDocumentId())) {
            throw new IllegalArgumentException("版本不存在或不属于该文档");
        }

        // 1. 当前主文件 -> 归档为新版本快照
        DmsDocumentVersion archive = new DmsDocumentVersion();
        archive.setDocumentId(docId);
        archive.setVersionNo(d.getLatestVersion() == null ? 1 : d.getLatestVersion());
        archive.setFileUrl(d.getFileUrl());
        archive.setFileName(d.getFileName());
        archive.setFileSize(d.getFileSize());
        archive.setMime(d.getMime());
        archive.setChangeLog("回滚到 v" + target.getVersionNo() + " 前的自动归档");
        archive.setCreateBy(operator);
        archive.setCreateTime(LocalDateTime.now());
        versionMapper.insert(archive);

        // 2. 选中版本 -> 主表
        d.setFileUrl(target.getFileUrl());
        d.setFileName(target.getFileName());
        d.setFileSize(target.getFileSize());
        d.setMime(target.getMime());
        d.setLatestVersion((d.getLatestVersion() == null ? 1 : d.getLatestVersion()) + 1);
        d.setUpdateTime(LocalDateTime.now());
        mapper.updateById(d);
        return d;
    }

    // ---------------- VO 与工具 ----------------

    private Map<String, Object> toListVO(DmsDocument d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("docNo", d.getDocNo());
        m.put("title", d.getTitle());
        m.put("categoryId", d.getCategoryId());
        m.put("docType", d.getDocType());
        m.put("tags", splitTags(d.getTags()));
        m.put("status", d.getStatus());
        m.put("latestVersion", d.getLatestVersion());
        m.put("fileName", d.getFileName());
        m.put("fileSize", d.getFileSize());
        m.put("mime", d.getMime());
        m.put("createBy", d.getCreateBy());
        m.put("createDept", d.getCreateDept());
        m.put("createTime", d.getCreateTime());
        m.put("updateTime", d.getUpdateTime());
        return m;
    }

    private Map<String, Object> toDetailVO(DmsDocument d) {
        Map<String, Object> m = toListVO(d);
        m.put("description", d.getDescription());
        m.put("fileUrl", d.getFileUrl());
        m.put("processInstanceId", d.getProcessInstanceId());
        return m;
    }

    /**
     * 提供给 workflow service 写回 status / processInstanceId
     */
    @Transactional
    public DmsDocument updateStatus(String id, String status, String processInstanceId) {
        DmsDocument d = mapper.selectById(id);
        if (d == null) return null;
        if (status != null) d.setStatus(status);
        if (processInstanceId != null) d.setProcessInstanceId(processInstanceId);
        d.setUpdateTime(LocalDateTime.now());
        mapper.updateById(d);
        return d;
    }

    public DmsDocument getById(String id) {
        return mapper.selectById(id);
    }

    private List<String> splitTags(String tags) {
        if (tags == null || tags.isBlank()) return Collections.emptyList();
        List<String> ret = new ArrayList<>();
        for (String t : tags.split(",")) {
            String s = t.trim();
            if (!s.isEmpty()) ret.add(s);
        }
        return ret;
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return Collections.emptyList();
        return Arrays.asList(tags.split(","));
    }

    /**
     * 生成业务编号：DMS-yyyyMMdd-XXXX
     */
    private String generateDocNo() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        LambdaQueryWrapper<DmsDocument> w = new LambdaQueryWrapper<>();
        w.likeRight(DmsDocument::getDocNo, "DMS-" + today + "-");
        Long count = mapper.selectCount(w);
        long next = (count == null ? 0 : count) + 1;
        return String.format("DMS-%s-%04d", today, next);
    }
}
