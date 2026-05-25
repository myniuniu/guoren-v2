package com.guoren.workflow.certificate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guoren.workflow.certificate.dto.CertificateTemplateDTO;
import com.guoren.workflow.certificate.dto.IssueRequestDTO;
import com.guoren.workflow.certificate.entity.CertificateTemplate;
import com.guoren.workflow.certificate.service.CertificateExcelService;
import com.guoren.workflow.certificate.service.CertificatePdfService;
import com.guoren.workflow.certificate.service.CertificateRenderService;
import com.guoren.workflow.certificate.service.CertificateTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * 证书模版与发放主接口
 * v1.1：扩展 PDF / JPG / Excel / JSON 导入导出 / ZIP 批量下载
 */
@Slf4j
@RestController
@RequestMapping("/api/certificate")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CertificateTemplateController {

    private final CertificateTemplateService service;
    private final CertificateRenderService renderService;
    private final CertificatePdfService pdfService;
    private final CertificateExcelService excelService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    /** 上传底图 */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String url = service.upload(file, uploadDir);
        Map<String, Object> ret = new HashMap<>();
        ret.put("url", url);
        return ResponseEntity.ok(ret);
    }

    /** 新建模版 */
    @PostMapping("/template")
    public ResponseEntity<CertificateTemplate> create(@RequestBody CertificateTemplateDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    /** 更新模版 */
    @PutMapping("/template/{id}")
    public ResponseEntity<CertificateTemplate> update(@PathVariable String id,
                                                      @RequestBody CertificateTemplateDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    /** 模版列表 */
    @GetMapping("/template/list")
    public ResponseEntity<List<Map<String, Object>>> list(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(service.list(keyword));
    }

    /** 模版详情 */
    @GetMapping("/template/{id}")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String id) {
        Map<String, Object> d = service.detail(id);
        if (d == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(d);
    }

    /** 软删除 */
    @DeleteMapping("/template/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** 模版 JSON 导出（D3） */
    @GetMapping("/template/{id}/export")
    public ResponseEntity<byte[]> exportTpl(@PathVariable String id) throws IOException {
        Map<String, Object> d = service.detail(id);
        if (d == null) return ResponseEntity.notFound().build();
        byte[] body = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(d);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDispositionFormData("attachment",
                "cert-template-" + d.getOrDefault("tplKey", id) + ".json");
        return new ResponseEntity<>(body, headers, 200);
    }

    /** 模版 JSON 导入（D3） */
    @PostMapping("/template/import")
    @SuppressWarnings("unchecked")
    public ResponseEntity<CertificateTemplate> importTpl(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> raw = objectMapper.readValue(file.getInputStream(), Map.class);
        CertificateTemplateDTO dto = new CertificateTemplateDTO();
        dto.setName(asStr(raw.get("name"), "导入证书"));
        dto.setTplKey(null); // 重新生成 key
        dto.setBgUrl(asStr(raw.get("bgUrl"), null));
        dto.setWidth(asInt(raw.get("width"), 1123));
        dto.setHeight(asInt(raw.get("height"), 794));
        dto.setFields((List<Map<String, Object>>) raw.get("fields"));
        Object canvas = raw.get("canvasJson");
        dto.setCanvasJson(canvas instanceof Map ? (Map<String, Object>) canvas : null);
        dto.setThumbnail(asStr(raw.get("thumbnail"), null));
        return ResponseEntity.ok(service.create(dto));
    }

    /** 渲染单张证书：根据 format 返回 PNG/JPG/PDF */
    @PostMapping("/issue/render")
    public ResponseEntity<byte[]> renderOne(@RequestBody IssueRequestDTO req) throws IOException {
        CertificateTemplate t = service.getEntity(req.getTemplateId());
        if (t == null) return ResponseEntity.notFound().build();

        Map<String, Object> data = mergeWithSamples(t, req.getData());
        String fmt = (req.getFormat() == null ? "png" : req.getFormat().toLowerCase());

        HttpHeaders headers = new HttpHeaders();
        byte[] body;
        if ("pdf".equals(fmt)) {
            byte[] png = renderService.renderToFormat(t, data, "png", null);
            body = pdfService.toPdf(png, t.getWidth() == null ? 1123 : t.getWidth(),
                    t.getHeight() == null ? 794 : t.getHeight());
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "certificate.pdf");
        } else if ("jpg".equals(fmt) || "jpeg".equals(fmt)) {
            body = renderService.renderToFormat(t, data, "jpg", req.getQuality());
            headers.setContentType(MediaType.IMAGE_JPEG);
            headers.setContentDispositionFormData("inline", "certificate.jpg");
        } else {
            body = renderService.renderToFormat(t, data, "png", null);
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("inline", "certificate.png");
        }
        return new ResponseEntity<>(body, headers, 200);
    }

    /** 批量渲染：返回 [{ name, base64, mime }] */
    @PostMapping("/issue/render-batch")
    public ResponseEntity<List<Map<String, Object>>> renderBatch(@RequestBody IssueRequestDTO req) throws IOException {
        CertificateTemplate t = service.getEntity(req.getTemplateId());
        if (t == null) return ResponseEntity.notFound().build();

        String fmt = (req.getFormat() == null ? "png" : req.getFormat().toLowerCase());
        List<Map<String, Object>> results = new ArrayList<>();
        List<Map<String, Object>> dataList = req.getDataList() == null ? List.of() : req.getDataList();
        int idx = 1;
        for (Map<String, Object> data : dataList) {
            Map<String, Object> merged = mergeWithSamples(t, data);
            byte[] body = renderOneBytes(t, merged, fmt, req.getQuality());
            String mime = mimeOf(fmt);
            String ext = extOf(fmt);
            String name = pickName(merged, idx);
            Map<String, Object> item = new HashMap<>();
            item.put("name", name + "." + ext);
            item.put("mime", mime);
            item.put("base64", "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(body));
            results.add(item);
            idx++;
        }
        return ResponseEntity.ok(results);
    }

    /** 批量下载为 ZIP（F1 配套） */
    @PostMapping("/issue/render-zip")
    public ResponseEntity<byte[]> renderZip(@RequestBody IssueRequestDTO req) throws IOException {
        CertificateTemplate t = service.getEntity(req.getTemplateId());
        if (t == null) return ResponseEntity.notFound().build();

        String fmt = (req.getFormat() == null ? "png" : req.getFormat().toLowerCase());
        String ext = extOf(fmt);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            int idx = 1;
            List<Map<String, Object>> dataList = req.getDataList() == null ? List.of() : req.getDataList();
            for (Map<String, Object> data : dataList) {
                Map<String, Object> merged = mergeWithSamples(t, data);
                byte[] body = renderOneBytes(t, merged, fmt, req.getQuality());
                ZipEntry entry = new ZipEntry(pickName(merged, idx) + "." + ext);
                zos.putNextEntry(entry);
                zos.write(body);
                zos.closeEntry();
                idx++;
            }
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/zip"));
        headers.setContentDispositionFormData("attachment", "certificates.zip");
        return new ResponseEntity<>(baos.toByteArray(), headers, 200);
    }

    /** Excel 导入解析（F3）：返回 [{ key:value }, ...] */
    @PostMapping("/issue/parse-excel")
    public ResponseEntity<List<Map<String, Object>>> parseExcel(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(excelService.parse(file));
    }

    private byte[] renderOneBytes(CertificateTemplate t, Map<String, Object> data,
                                  String fmt, Float quality) throws IOException {
        if ("pdf".equals(fmt)) {
            byte[] png = renderService.renderToFormat(t, data, "png", null);
            return pdfService.toPdf(png, t.getWidth() == null ? 1123 : t.getWidth(),
                    t.getHeight() == null ? 794 : t.getHeight());
        }
        if ("jpg".equals(fmt) || "jpeg".equals(fmt)) {
            return renderService.renderToFormat(t, data, "jpg", quality);
        }
        return renderService.renderToFormat(t, data, "png", null);
    }

    private String mimeOf(String fmt) {
        if ("pdf".equals(fmt)) return "application/pdf";
        if ("jpg".equals(fmt) || "jpeg".equals(fmt)) return "image/jpeg";
        return "image/png";
    }

    private String extOf(String fmt) {
        if ("pdf".equals(fmt)) return "pdf";
        if ("jpg".equals(fmt) || "jpeg".equals(fmt)) return "jpg";
        return "png";
    }

    private Map<String, Object> mergeWithSamples(CertificateTemplate t, Map<String, Object> data) {
        Map<String, Object> samples = service.getFieldSamples(t);
        Map<String, Object> merged = new HashMap<>(samples);
        if (data != null) {
            for (Map.Entry<String, Object> e : data.entrySet()) {
                Object v = e.getValue();
                if (v != null && !(v instanceof String && ((String) v).isEmpty())) {
                    merged.put(e.getKey(), v);
                }
            }
        }
        return merged;
    }

    private String pickName(Map<String, Object> data, int index) {
        for (String key : new String[]{"studentName", "name", "userName", "certNo"}) {
            Object v = data.get(key);
            if (v != null && !v.toString().isBlank()) {
                return "证书_" + v;
            }
        }
        return "证书_" + index;
    }

    private static String asStr(Object o, String dft) {
        return o == null ? dft : String.valueOf(o);
    }

    private static Integer asInt(Object o, Integer dft) {
        if (o instanceof Number n) return n.intValue();
        if (o instanceof String s && !s.isBlank()) {
            try { return Integer.parseInt(s); } catch (Exception ignore) {}
        }
        return dft;
    }
}
