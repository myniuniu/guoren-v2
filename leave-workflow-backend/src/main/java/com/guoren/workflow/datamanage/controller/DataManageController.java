package com.guoren.workflow.datamanage.controller;

import com.guoren.workflow.datamanage.dto.ColumnInfo;
import com.guoren.workflow.datamanage.dto.CreateTableRequest;
import com.guoren.workflow.datamanage.dto.RowsResponse;
import com.guoren.workflow.datamanage.dto.TableInfo;
import com.guoren.workflow.datamanage.service.DataManageService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.*;

@RestController
@RequestMapping("/api/datamanage")
@CrossOrigin(origins = "*")
public class DataManageController {

    private final DataManageService service;
    private final DataSource dataSource;

    public DataManageController(DataManageService service, DataSource dataSource) {
        this.service = service;
        this.dataSource = dataSource;
    }

    // ====================== 数据源信息 ======================

    @GetMapping("/datasource")
    public Map<String, Object> currentDataSource() {
        Map<String, Object> info = new LinkedHashMap<>();
        try (Connection c = dataSource.getConnection()) {
            DatabaseMetaData m = c.getMetaData();
            info.put("type", m.getDatabaseProductName()); // H2 / MySQL
            info.put("version", m.getDatabaseProductVersion());
            info.put("url", m.getURL());
            info.put("username", m.getUserName());
            info.put("driver", m.getDriverName());
            info.put("supportedTypes", List.of("h2", "mysql"));
            info.put("currentType", m.getDatabaseProductName().toLowerCase(Locale.ROOT).contains("mysql") ? "mysql" : "h2");
        } catch (Exception e) {
            info.put("error", e.getMessage());
        }
        return info;
    }

    // ====================== 表 ======================

    @GetMapping("/tables")
    public List<TableInfo> listTables() {
        return service.listTables();
    }

    @PostMapping("/tables")
    public Map<String, Object> createTable(@RequestBody CreateTableRequest req) {
        service.createTable(req);
        return Map.of("success", true, "name", req.getName());
    }

    @DeleteMapping("/tables/{name}")
    public Map<String, Object> dropTable(@PathVariable String name) {
        service.dropTable(name);
        return Map.of("success", true);
    }

    @PostMapping("/tables/{name}/rename")
    public Map<String, Object> renameTable(@PathVariable String name, @RequestBody Map<String, String> body) {
        service.renameTable(name, body.get("newName"));
        return Map.of("success", true);
    }

    // ====================== 列 ======================

    @GetMapping("/tables/{name}/columns")
    public List<ColumnInfo> listColumns(@PathVariable String name) {
        return service.listColumns(name);
    }

    @PostMapping("/tables/{name}/columns")
    public Map<String, Object> addColumn(@PathVariable String name, @RequestBody ColumnInfo column) {
        service.addColumn(name, column);
        return Map.of("success", true);
    }

    @DeleteMapping("/tables/{name}/columns/{column}")
    public Map<String, Object> dropColumn(@PathVariable String name, @PathVariable String column) {
        service.dropColumn(name, column);
        return Map.of("success", true);
    }

    @PostMapping("/tables/{name}/columns/{column}/rename")
    public Map<String, Object> renameColumn(@PathVariable String name, @PathVariable String column,
                                            @RequestBody Map<String, String> body) {
        service.renameColumn(name, column, body.get("newName"));
        return Map.of("success", true);
    }

    // ====================== 行数据 ======================

    @GetMapping("/tables/{name}/rows")
    public RowsResponse listRows(
            @PathVariable String name,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) Map<String, String> all) {
        // 提取 filter.xxx 的过滤条件
        Map<String, String> filters = new LinkedHashMap<>();
        if (all != null) {
            for (Map.Entry<String, String> e : all.entrySet()) {
                if (e.getKey().startsWith("filter.")) {
                    filters.put(e.getKey().substring("filter.".length()), e.getValue());
                }
            }
        }
        return service.listRows(name, page, pageSize, keyword, sortBy, sortDir, filters);
    }

    @PostMapping("/tables/{name}/rows")
    public Map<String, Object> insertRow(@PathVariable String name, @RequestBody Map<String, Object> data,
                                         @RequestHeader(value = "X-User", required = false) String user) {
        return service.insertRow(name, data, user);
    }

    @PutMapping("/tables/{name}/rows/{id}")
    public Map<String, Object> updateRow(@PathVariable String name, @PathVariable String id,
                                         @RequestBody Map<String, Object> data,
                                         @RequestHeader(value = "X-User", required = false) String user) {
        int updated = service.updateRow(name, id, data, user);
        return Map.of("success", true, "updated", updated);
    }

    @DeleteMapping("/tables/{name}/rows/{id}")
    public Map<String, Object> deleteRow(@PathVariable String name, @PathVariable String id) {
        int deleted = service.deleteRows(name, List.of(id));
        return Map.of("success", true, "deleted", deleted);
    }

    @PostMapping("/tables/{name}/rows/batch-delete")
    public Map<String, Object> batchDeleteRows(@PathVariable String name, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Object> ids = (List<Object>) body.get("ids");
        int deleted = service.deleteRows(name, ids);
        return Map.of("success", true, "deleted", deleted);
    }

    @PostMapping("/tables/{name}/truncate")
    public Map<String, Object> truncate(@PathVariable String name) {
        int deleted = service.truncate(name);
        return Map.of("success", true, "deleted", deleted);
    }

    // ====================== 导入 / 导出 CSV ======================

    @GetMapping(value = "/tables/{name}/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportCsv(@PathVariable String name) throws Exception {
        List<ColumnInfo> cols = service.listColumns(name);
        RowsResponse rs = service.listRows(name, 1, 1000, null, null, null, null);
        StringBuilder sb = new StringBuilder();
        // header
        for (int i = 0; i < cols.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(escapeCsv(cols.get(i).getName()));
        }
        sb.append("\r\n");
        for (Map<String, Object> row : rs.getRows()) {
            for (int i = 0; i < cols.size(); i++) {
                if (i > 0) sb.append(',');
                Object v = row.get(cols.get(i).getName());
                sb.append(escapeCsv(v == null ? "" : v.toString()));
            }
            sb.append("\r\n");
        }
        byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] body = sb.toString().getBytes(StandardCharsets.UTF_8);
        byte[] out = new byte[bom.length + body.length];
        System.arraycopy(bom, 0, out, 0, bom.length);
        System.arraycopy(body, 0, out, bom.length, body.length);
        String fileName = URLEncoder.encode(name + ".csv", StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(out);
    }

    @PostMapping("/tables/{name}/import")
    public Map<String, Object> importCsv(@PathVariable String name,
                                         @RequestParam("file") MultipartFile file,
                                         @RequestHeader(value = "X-User", required = false) String user) throws Exception {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件为空");
        }
        int success = 0, fail = 0;
        List<String> errors = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = br.readLine();
            if (headerLine == null) return Map.of("success", true, "successCount", 0, "failCount", 0);
            // 处理 BOM
            if (headerLine.startsWith("\uFEFF")) headerLine = headerLine.substring(1);
            String[] headers = parseCsvLine(headerLine);
            String line;
            while ((line = br.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] vals = parseCsvLine(line);
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.length && i < vals.length; i++) {
                    row.put(headers[i], vals[i]);
                }
                try {
                    service.insertRow(name, row, user);
                    success++;
                } catch (Exception e) {
                    fail++;
                    errors.add(e.getMessage());
                }
            }
        }
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("successCount", success);
        resp.put("failCount", fail);
        resp.put("errors", errors);
        return resp;
    }

    private String escapeCsv(String s) {
        if (s == null) return "";
        boolean need = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
        String r = s.replace("\"", "\"\"");
        return need ? "\"" + r + "\"" : r;
    }

    private String[] parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuote = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (inQuote) {
                if (ch == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        cur.append('"');
                        i++;
                    } else {
                        inQuote = false;
                    }
                } else {
                    cur.append(ch);
                }
            } else {
                if (ch == ',') {
                    out.add(cur.toString());
                    cur.setLength(0);
                } else if (ch == '"') {
                    inQuote = true;
                } else {
                    cur.append(ch);
                }
            }
        }
        out.add(cur.toString());
        return out.toArray(new String[0]);
    }

    // ====================== 异常处理 ======================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception e) {
        return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
    }
}
