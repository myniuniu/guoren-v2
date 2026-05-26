package com.guoren.workflow.datamanage.service;

import com.guoren.workflow.datamanage.dto.ColumnInfo;
import com.guoren.workflow.datamanage.dto.CreateTableRequest;
import com.guoren.workflow.datamanage.dto.RowsResponse;
import com.guoren.workflow.datamanage.dto.TableInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.*;
import java.util.regex.Pattern;

/**
 * 数据管理服务：基于 JDBC 通用元数据 + 动态 SQL，实现表/列/行的 CRUD。
 * 当前对接内置 H2，后续可扩展 MySQL（DDL 类型映射会有差异，提供 typeFor() 适配点）。
 */
@Service
public class DataManageService {

    /** 业务字段类型 -> H2 物理类型 */
    private static final Map<String, String> H2_TYPE_MAP = new LinkedHashMap<>();
    static {
        H2_TYPE_MAP.put("uuid", "VARCHAR(36)");
        H2_TYPE_MAP.put("text", "VARCHAR(512)");
        H2_TYPE_MAP.put("longtext", "CLOB");
        H2_TYPE_MAP.put("number", "DECIMAL(20,4)");
        H2_TYPE_MAP.put("int", "INT");
        H2_TYPE_MAP.put("bigint", "BIGINT");
        H2_TYPE_MAP.put("datetime", "TIMESTAMP");
        H2_TYPE_MAP.put("date", "DATE");
        H2_TYPE_MAP.put("boolean", "BOOLEAN");
        H2_TYPE_MAP.put("user", "VARCHAR(128)");
        H2_TYPE_MAP.put("select", "VARCHAR(128)");
        H2_TYPE_MAP.put("multiselect", "VARCHAR(512)");
        H2_TYPE_MAP.put("json", "CLOB");
    }

    /** 平台禁止管理的系统/Flowable 表前缀（防止误改 Flowable 表） */
    private static final List<String> FORBIDDEN_PREFIX = Arrays.asList(
            "ACT_", "FLW_", "INFORMATION_SCHEMA"
    );

    /** 合法标识符：字母/数字/下划线，且必须以字母或下划线开头 */
    private static final Pattern IDENTIFIER = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]*$");

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Autowired
    public DataManageService(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    // ====================== 工具方法 ======================

    private void validateIdentifier(String id) {
        if (id == null || !IDENTIFIER.matcher(id).matches()) {
            throw new IllegalArgumentException("非法标识符: " + id);
        }
    }

    private void checkTableAllowed(String table) {
        validateIdentifier(table);
        String upper = table.toUpperCase(Locale.ROOT);
        for (String pre : FORBIDDEN_PREFIX) {
            if (upper.startsWith(pre)) {
                throw new IllegalArgumentException("系统表不允许操作: " + table);
            }
        }
    }

    private String typeFor(ColumnInfo col) {
        String biz = col.getFieldType() == null ? "text" : col.getFieldType().toLowerCase(Locale.ROOT);
        String mapped = H2_TYPE_MAP.get(biz);
        // 若用户填了具体的 dbType，则优先使用 dbType（必须是字母数字+括号数字逗号）
        String dbType = col.getDbType();
        if (dbType != null && !dbType.isBlank()
                && dbType.matches("^[A-Za-z][A-Za-z0-9]*(\\([0-9]+(\\s*,\\s*[0-9]+)?\\))?$")) {
            // dbType 直接落库，简单兼容：如 varchar -> VARCHAR(255)
            String dt = dbType.toUpperCase(Locale.ROOT);
            if (dt.equals("VARCHAR")) return "VARCHAR(255)";
            if (dt.equals("TEXT")) return "VARCHAR(512)";
            if (dt.equals("INT4")) return "INT";
            if (dt.equals("INT8")) return "BIGINT";
            if (dt.equals("NUMERIC")) return "DECIMAL(20,4)";
            if (dt.equals("TIMESTAMPTZ")) return "TIMESTAMP";
            if (dt.equals("USER_PROFILE")) return "VARCHAR(128)";
            if (dt.equals("JSONB")) return "CLOB";
            if (dt.equals("UUID")) return "VARCHAR(36)";
            return dt;
        }
        return mapped == null ? "VARCHAR(255)" : mapped;
    }

    /** 标准化列名为大写（H2 默认大写） */
    private String norm(String s) {
        return s == null ? null : s.toUpperCase(Locale.ROOT);
    }

    /** 双引号包裹并转大写，用于 H2 SQL 标识符（解决大小写敏感问题） */
    private String q(String identifier) {
        return '"' + norm(identifier) + '"';
    }

    // ====================== 表元数据 ======================

    public List<TableInfo> listTables() {
        List<TableInfo> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            try (ResultSet rs = meta.getTables(null, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    String remarks = rs.getString("REMARKS");
                    // 过滤 INFORMATION_SCHEMA 等 H2 系统表的 schema
                    String schema = rs.getString("TABLE_SCHEM");
                    if (schema != null && schema.equalsIgnoreCase("INFORMATION_SCHEMA")) continue;
                    String upper = tableName.toUpperCase(Locale.ROOT);
                    boolean forbidden = false;
                    for (String pre : FORBIDDEN_PREFIX) {
                        if (upper.startsWith(pre)) { forbidden = true; break; }
                    }
                    if (forbidden) continue;
                    Long rowCount = null;
                    try {
                        rowCount = jdbcTemplate.queryForObject(
                                "SELECT COUNT(*) FROM \"" + tableName + "\"", Long.class);
                    } catch (Exception ignore) { /* 跳过不可计数的表 */ }
                    list.add(new TableInfo(tableName.toLowerCase(Locale.ROOT), remarks, rowCount));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("读取表列表失败: " + e.getMessage(), e);
        }
        return list;
    }

    public List<ColumnInfo> listColumns(String table) {
        checkTableAllowed(table);
        List<ColumnInfo> cols = new ArrayList<>();
        Set<String> primaryKeys = new HashSet<>();
        Set<String> uniqueKeys = new HashSet<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            try (ResultSet pkRs = meta.getPrimaryKeys(null, null, norm(table))) {
                while (pkRs.next()) {
                    primaryKeys.add(pkRs.getString("COLUMN_NAME").toLowerCase(Locale.ROOT));
                }
            }
            try (ResultSet idxRs = meta.getIndexInfo(null, null, norm(table), true, false)) {
                while (idxRs.next()) {
                    String c = idxRs.getString("COLUMN_NAME");
                    if (c != null) uniqueKeys.add(c.toLowerCase(Locale.ROOT));
                }
            }
            try (ResultSet rs = meta.getColumns(null, null, norm(table), "%")) {
                while (rs.next()) {
                    ColumnInfo c = new ColumnInfo();
                    c.setName(rs.getString("COLUMN_NAME").toLowerCase(Locale.ROOT));
                    String dbType = rs.getString("TYPE_NAME");
                    c.setDbType(dbType);
                    c.setFieldType(reverseMapType(dbType));
                    c.setComment(rs.getString("REMARKS"));
                    c.setNullable("YES".equalsIgnoreCase(rs.getString("IS_NULLABLE")));
                    c.setLength(rs.getInt("COLUMN_SIZE"));
                    c.setDefaultValue(rs.getString("COLUMN_DEF"));
                    c.setPrimary(primaryKeys.contains(c.getName()));
                    c.setUnique(uniqueKeys.contains(c.getName()));
                    c.setMulti(false);
                    cols.add(c);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("读取列信息失败: " + e.getMessage(), e);
        }
        return cols;
    }

    private String reverseMapType(String dbType) {
        if (dbType == null) return "text";
        String t = dbType.toUpperCase(Locale.ROOT);
        if (t.contains("INT") && !t.contains("BIG")) return "int";
        if (t.contains("BIGINT")) return "bigint";
        if (t.contains("DECIMAL") || t.contains("NUMERIC") || t.contains("DOUBLE") || t.contains("REAL")) return "number";
        if (t.contains("TIMESTAMP")) return "datetime";
        if (t.contains("DATE")) return "date";
        if (t.contains("BOOLEAN")) return "boolean";
        if (t.contains("CLOB") || t.contains("TEXT")) return "longtext";
        return "text";
    }

    // ====================== DDL ======================

    @Transactional
    public void createTable(CreateTableRequest req) {
        checkTableAllowed(req.getName());
        StringBuilder sb = new StringBuilder("CREATE TABLE ").append(q(req.getName())).append(" (");
        List<String> colDefs = new ArrayList<>();
        List<String> pks = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        // 自动补齐 5 个系统字段（若用户列表中未包含）
        boolean hasId = false, hasCa = false, hasCb = false, hasUa = false, hasUb = false;
        for (ColumnInfo c : req.getColumns()) {
            if (c.getName() == null) continue;
            String n = c.getName().toLowerCase(Locale.ROOT);
            if (n.equals("id")) hasId = true;
            if (n.equals("_created_at")) hasCa = true;
            if (n.equals("_created_by")) hasCb = true;
            if (n.equals("_updated_at")) hasUa = true;
            if (n.equals("_updated_by")) hasUb = true;
        }
        if (!hasId) {
            ColumnInfo id = new ColumnInfo("id", "uuid", "VARCHAR(36)", "主键", false, true, true, false, null, 36);
            req.getColumns().add(0, id);
        }
        if (!hasCa) req.getColumns().add(new ColumnInfo("_created_at", "datetime", "TIMESTAMP", "创建时间", false, false, false, false, "CURRENT_TIMESTAMP", null));
        if (!hasCb) req.getColumns().add(new ColumnInfo("_created_by", "user", "VARCHAR(128)", "创建人", true, false, false, false, null, 128));
        if (!hasUa) req.getColumns().add(new ColumnInfo("_updated_at", "datetime", "TIMESTAMP", "更新时间", false, false, false, false, "CURRENT_TIMESTAMP", null));
        if (!hasUb) req.getColumns().add(new ColumnInfo("_updated_by", "user", "VARCHAR(128)", "更新人", true, false, false, false, null, 128));
        for (ColumnInfo c : req.getColumns()) {
            validateIdentifier(c.getName());
            if (!seen.add(c.getName().toLowerCase(Locale.ROOT))) {
                throw new IllegalArgumentException("字段重复: " + c.getName());
            }
            StringBuilder def = new StringBuilder();
            def.append(q(c.getName())).append(" ").append(typeFor(c));
            if (Boolean.TRUE.equals(c.getPrimary())) {
                pks.add(q(c.getName()));
            }
            if (Boolean.FALSE.equals(c.getNullable()) || Boolean.TRUE.equals(c.getPrimary())) {
                def.append(" NOT NULL");
            }
            if (Boolean.TRUE.equals(c.getUnique()) && !Boolean.TRUE.equals(c.getPrimary())) {
                def.append(" UNIQUE");
            }
            if (c.getDefaultValue() != null && !c.getDefaultValue().isBlank()) {
                String dv = c.getDefaultValue().trim();
                if (dv.equalsIgnoreCase("CURRENT_TIMESTAMP") || dv.matches("^-?[0-9]+(\\.[0-9]+)?$")) {
                    def.append(" DEFAULT ").append(dv);
                } else {
                    def.append(" DEFAULT '").append(dv.replace("'", "''")).append("'");
                }
            }
            colDefs.add(def.toString());
        }
        sb.append(String.join(", ", colDefs));
        if (!pks.isEmpty()) {
            sb.append(", PRIMARY KEY(").append(String.join(", ", pks)).append(")");
        }
        sb.append(")");
        if (req.getComment() != null && !req.getComment().isBlank()) {
            // H2 不支持 inline COMMENT，使用 COMMENT ON 语法
        }
        jdbcTemplate.execute(sb.toString());
        if (req.getComment() != null && !req.getComment().isBlank()) {
            try {
                jdbcTemplate.execute("COMMENT ON TABLE " + q(req.getName()) + " IS '" +
                        req.getComment().replace("'", "''") + "'");
            } catch (Exception ignore) {}
        }
    }

    @Transactional
    public void dropTable(String table) {
        checkTableAllowed(table);
        jdbcTemplate.execute("DROP TABLE IF EXISTS " + q(table));
    }

    @Transactional
    public void renameTable(String table, String newName) {
        checkTableAllowed(table);
        checkTableAllowed(newName);
        jdbcTemplate.execute("ALTER TABLE " + q(table) + " RENAME TO " + q(newName));
    }

    @Transactional
    public void addColumn(String table, ColumnInfo col) {
        checkTableAllowed(table);
        validateIdentifier(col.getName());
        StringBuilder sb = new StringBuilder("ALTER TABLE ").append(q(table))
                .append(" ADD COLUMN ").append(q(col.getName())).append(" ").append(typeFor(col));
        if (Boolean.FALSE.equals(col.getNullable())) sb.append(" NOT NULL");
        if (Boolean.TRUE.equals(col.getUnique())) sb.append(" UNIQUE");
        jdbcTemplate.execute(sb.toString());
    }

    @Transactional
    public void dropColumn(String table, String column) {
        checkTableAllowed(table);
        validateIdentifier(column);
        jdbcTemplate.execute("ALTER TABLE " + q(table) + " DROP COLUMN " + q(column));
    }

    @Transactional
    public void renameColumn(String table, String column, String newName) {
        checkTableAllowed(table);
        validateIdentifier(column);
        validateIdentifier(newName);
        jdbcTemplate.execute("ALTER TABLE " + q(table) + " ALTER COLUMN " + q(column) + " RENAME TO " + q(newName));
    }

    // ====================== DML 行 CRUD ======================

    public RowsResponse listRows(String table, int page, int pageSize, String keyword,
                                 String sortBy, String sortDir, Map<String, String> filters) {
        checkTableAllowed(table);
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 1000) pageSize = 50;

        List<ColumnInfo> cols = listColumns(table);
        List<String> colNames = cols.stream().map(ColumnInfo::getName).toList();

        StringBuilder where = new StringBuilder();
        List<Object> args = new ArrayList<>();
        if (keyword != null && !keyword.isBlank()) {
            // 在所有字符串列做 LIKE
            List<String> likeParts = new ArrayList<>();
            for (ColumnInfo c : cols) {
                String t = (c.getDbType() == null ? "" : c.getDbType().toUpperCase(Locale.ROOT));
                if (t.contains("CHAR") || t.contains("CLOB") || t.contains("TEXT")) {
                    likeParts.add("CAST(" + q(c.getName()) + " AS VARCHAR(2000)) LIKE ?");
                    args.add("%" + keyword + "%");
                }
            }
            if (!likeParts.isEmpty()) {
                where.append(" WHERE (").append(String.join(" OR ", likeParts)).append(")");
            }
        }
        if (filters != null) {
            for (Map.Entry<String, String> e : filters.entrySet()) {
                if (!colNames.contains(e.getKey().toLowerCase(Locale.ROOT))) continue;
                if (e.getValue() == null || e.getValue().isBlank()) continue;
                where.append(where.length() == 0 ? " WHERE " : " AND ");
                where.append(q(e.getKey())).append(" = ?");
                args.add(e.getValue());
            }
        }

        // 排序
        StringBuilder order = new StringBuilder();
        if (sortBy != null && colNames.contains(sortBy.toLowerCase(Locale.ROOT))) {
            String dir = "DESC".equalsIgnoreCase(sortDir) ? "DESC" : "ASC";
            order.append(" ORDER BY ").append(q(sortBy)).append(" ").append(dir);
        } else if (colNames.contains("_created_at")) {
            order.append(" ORDER BY ").append(q("_created_at")).append(" DESC");
        }

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + q(table) + where, Long.class, args.toArray());
        int offset = (page - 1) * pageSize;
        String sql = "SELECT * FROM " + q(table) + where + order
                + " LIMIT " + pageSize + " OFFSET " + offset;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args.toArray());
        // 列名小写化
        List<Map<String, Object>> normalized = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            for (Map.Entry<String, Object> e : row.entrySet()) {
                m.put(e.getKey().toLowerCase(Locale.ROOT), e.getValue());
            }
            normalized.add(m);
        }
        return new RowsResponse(total == null ? 0 : total, page, pageSize, normalized);
    }

    @Transactional
    public Map<String, Object> insertRow(String table, Map<String, Object> data, String operator) {
        checkTableAllowed(table);
        List<ColumnInfo> cols = listColumns(table);
        Map<String, ColumnInfo> colMap = new HashMap<>();
        for (ColumnInfo c : cols) colMap.put(c.getName(), c);

        Map<String, Object> row = new LinkedHashMap<>(data == null ? Map.of() : data);
        // 自动填充系统字段
        if (colMap.containsKey("id") && (row.get("id") == null || row.get("id").toString().isBlank())) {
            row.put("id", UUID.randomUUID().toString());
        }
        if (colMap.containsKey("_created_at") && row.get("_created_at") == null) {
            row.put("_created_at", new java.sql.Timestamp(System.currentTimeMillis()));
        }
        if (colMap.containsKey("_updated_at") && row.get("_updated_at") == null) {
            row.put("_updated_at", new java.sql.Timestamp(System.currentTimeMillis()));
        }
        if (colMap.containsKey("_created_by") && row.get("_created_by") == null) {
            row.put("_created_by", operator == null ? "system" : operator);
        }
        if (colMap.containsKey("_updated_by") && row.get("_updated_by") == null) {
            row.put("_updated_by", operator == null ? "system" : operator);
        }

        List<String> colsInsert = new ArrayList<>();
        List<Object> valsInsert = new ArrayList<>();
        for (Map.Entry<String, Object> e : row.entrySet()) {
            ColumnInfo ci = colMap.get(e.getKey().toLowerCase(Locale.ROOT));
            if (ci == null) continue;
            colsInsert.add(q(e.getKey()));
            valsInsert.add(coerceValue(e.getValue(), ci));
        }
        String sql = "INSERT INTO " + q(table) + " (" + String.join(", ", colsInsert)
                + ") VALUES (" + String.join(", ", Collections.nCopies(valsInsert.size(), "?")) + ")";
        jdbcTemplate.update(sql, valsInsert.toArray());
        return row;
    }

    @Transactional
    public int updateRow(String table, Object id, Map<String, Object> data, String operator) {
        checkTableAllowed(table);
        if (data == null || data.isEmpty()) return 0;
        List<ColumnInfo> cols = listColumns(table);
        Map<String, ColumnInfo> colMap = new HashMap<>();
        for (ColumnInfo c : cols) colMap.put(c.getName(), c);
        if (colMap.containsKey("_updated_at")) data.put("_updated_at", new java.sql.Timestamp(System.currentTimeMillis()));
        if (colMap.containsKey("_updated_by")) data.put("_updated_by", operator == null ? "system" : operator);

        List<String> sets = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        for (Map.Entry<String, Object> e : data.entrySet()) {
            String k = e.getKey().toLowerCase(Locale.ROOT);
            ColumnInfo ci = colMap.get(k);
            if (ci == null || k.equals("id")) continue;
            sets.add(q(e.getKey()) + " = ?");
            args.add(coerceValue(e.getValue(), ci));
        }
        if (sets.isEmpty()) return 0;
        args.add(id);
        return jdbcTemplate.update("UPDATE " + q(table) + " SET " + String.join(", ", sets) + " WHERE " + q("id") + " = ?",
                args.toArray());
    }

    /** 按列类型强转值：空字符串→null；数值/时间/布尔等类型从 String 转为对应 JDBC 类型 */
    private Object coerceValue(Object value, ColumnInfo col) {
        if (value == null) return null;
        if (value instanceof String) {
            String s = ((String) value).trim();
            if (s.isEmpty()) return null;
            String dbType = col.getDbType() == null ? "" : col.getDbType().toUpperCase(Locale.ROOT);
            try {
                if (dbType.contains("INT") || dbType.contains("BIGINT") || dbType.contains("SMALLINT") || dbType.contains("TINYINT")) {
                    return Long.parseLong(s);
                }
                if (dbType.contains("DECIMAL") || dbType.contains("NUMERIC") || dbType.contains("DOUBLE") || dbType.contains("FLOAT") || dbType.contains("REAL")) {
                    return new java.math.BigDecimal(s);
                }
                if (dbType.contains("TIMESTAMP") || dbType.equals("DATETIME")) {
                    return java.sql.Timestamp.valueOf(s.length() == 10 ? s + " 00:00:00" : s);
                }
                if (dbType.equals("DATE")) {
                    return java.sql.Date.valueOf(s);
                }
                if (dbType.equals("TIME")) {
                    return java.sql.Time.valueOf(s);
                }
                if (dbType.contains("BOOL") || dbType.equals("BIT")) {
                    return Boolean.parseBoolean(s) || "1".equals(s) || "y".equalsIgnoreCase(s);
                }
            } catch (Exception ex) {
                throw new IllegalArgumentException("字段 " + col.getName() + " 值格式错误：" + s + "（期望类型 " + dbType + "）");
            }
            return s;
        }
        return value;
    }

    @Transactional
    public int deleteRows(String table, List<Object> ids) {
        checkTableAllowed(table);
        if (ids == null || ids.isEmpty()) return 0;
        String placeholders = String.join(", ", Collections.nCopies(ids.size(), "?"));
        return jdbcTemplate.update("DELETE FROM " + q(table) + " WHERE " + q("id") + " IN (" + placeholders + ")",
                ids.toArray());
    }

    @Transactional
    public int truncate(String table) {
        checkTableAllowed(table);
        return jdbcTemplate.update("DELETE FROM " + q(table));
    }
}

