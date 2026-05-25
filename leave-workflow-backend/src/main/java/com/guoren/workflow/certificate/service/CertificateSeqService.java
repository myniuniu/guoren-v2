package com.guoren.workflow.certificate.service;

import com.guoren.workflow.certificate.entity.CertificateSeq;
import com.guoren.workflow.certificate.mapper.CertificateSeqMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 证书编号自动生成服务（E4）
 * 规则模式占位符：
 *   {yyyy} {MM} {dd} {yyyyMMdd} {HH} {mm} {ss}
 *   {seq}        当前流水号原值
 *   {seq:0000}   按宽度补零的流水号
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateSeqService {

    private final CertificateSeqMapper mapper;

    private static final Pattern SEQ_TOKEN = Pattern.compile("\\{seq(?::(0+))?\\}");

    public List<CertificateSeq> list() {
        return mapper.selectList(null);
    }

    /** 取单条规则 */
    public CertificateSeq get(String ruleKey) {
        if (ruleKey == null || ruleKey.isBlank()) return null;
        return mapper.selectById(ruleKey);
    }

    /** 删除规则 */
    @Transactional
    public void delete(String ruleKey) {
        if (ruleKey == null || ruleKey.isBlank()) throw new IllegalArgumentException("ruleKey 必填");
        mapper.deleteById(ruleKey);
    }

    /** 重置流水号到指定值（默认 0，下一个就是 1） */
    @Transactional
    public CertificateSeq reset(String ruleKey, Long currentSeq) {
        CertificateSeq s = mapper.selectById(ruleKey);
        if (s == null) throw new IllegalArgumentException("规则不存在: " + ruleKey);
        s.setCurrentSeq(currentSeq == null ? 0L : Math.max(0L, currentSeq));
        s.setUpdateTime(LocalDateTime.now());
        mapper.updateById(s);
        return s;
    }

    @Transactional
    public CertificateSeq save(String ruleKey, String rulePattern) {
        if (ruleKey == null || ruleKey.isBlank()) throw new IllegalArgumentException("ruleKey 必填");
        CertificateSeq exist = mapper.selectById(ruleKey);
        if (exist == null) {
            CertificateSeq s = new CertificateSeq();
            s.setRuleKey(ruleKey);
            s.setRulePattern(rulePattern == null ? "CERT-{yyyyMMdd}-{seq:0000}" : rulePattern);
            s.setCurrentSeq(0L);
            s.setUpdateTime(LocalDateTime.now());
            mapper.insert(s);
            return s;
        }
        if (rulePattern != null) exist.setRulePattern(rulePattern);
        exist.setUpdateTime(LocalDateTime.now());
        mapper.updateById(exist);
        return exist;
    }

    /** 取下一个并落库；同时返回填充后的字符串 */
    @Transactional
    public synchronized String next(String ruleKey) {
        CertificateSeq s = mapper.selectById(ruleKey);
        if (s == null) {
            // 自动初始化默认规则
            s = save(ruleKey, "CERT-{yyyyMMdd}-{seq:0000}");
        }
        long next = (s.getCurrentSeq() == null ? 0 : s.getCurrentSeq()) + 1;
        s.setCurrentSeq(next);
        s.setUpdateTime(LocalDateTime.now());
        mapper.updateById(s);
        return formatPattern(s.getRulePattern(), next);
    }

    /** 仅按规则计算下一号字符串而不落库（用于预览） */
    public String peek(String ruleKey) {
        CertificateSeq s = mapper.selectById(ruleKey);
        if (s == null) return formatPattern("CERT-{yyyyMMdd}-{seq:0000}", 1L);
        long next = (s.getCurrentSeq() == null ? 0 : s.getCurrentSeq()) + 1;
        return formatPattern(s.getRulePattern(), next);
    }

    private String formatPattern(String pattern, long seq) {
        if (pattern == null || pattern.isBlank()) return String.valueOf(seq);
        LocalDateTime now = LocalDateTime.now();
        String s = pattern;
        s = s.replace("{yyyyMMdd}", now.format(DateTimeFormatter.ofPattern("yyyyMMdd")));
        s = s.replace("{yyyy}", now.format(DateTimeFormatter.ofPattern("yyyy")));
        s = s.replace("{MM}", now.format(DateTimeFormatter.ofPattern("MM")));
        s = s.replace("{dd}", now.format(DateTimeFormatter.ofPattern("dd")));
        s = s.replace("{HH}", now.format(DateTimeFormatter.ofPattern("HH")));
        s = s.replace("{mm}", now.format(DateTimeFormatter.ofPattern("mm")));
        s = s.replace("{ss}", now.format(DateTimeFormatter.ofPattern("ss")));

        Matcher m = SEQ_TOKEN.matcher(s);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String pad = m.group(1);
            String value = pad == null ? String.valueOf(seq)
                    : String.format("%0" + pad.length() + "d", seq);
            m.appendReplacement(sb, Matcher.quoteReplacement(value));
        }
        m.appendTail(sb);
        return sb.toString();
    }
}
