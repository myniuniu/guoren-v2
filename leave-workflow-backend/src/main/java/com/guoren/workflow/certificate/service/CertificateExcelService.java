package com.guoren.workflow.certificate.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Excel 批量导入解析（F3）
 * 约定：第一行为字段 key，从第二行开始为数据
 */
@Slf4j
@Service
public class CertificateExcelService {

    private static final SimpleDateFormat DATE_FMT = new SimpleDateFormat("yyyy-MM-dd");

    public List<Map<String, Object>> parse(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Excel 文件为空");
        try (InputStream is = file.getInputStream();
             Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null) return List.of();

            int firstRow = sheet.getFirstRowNum();
            int lastRow = sheet.getLastRowNum();
            if (lastRow <= firstRow) return List.of();

            Row header = sheet.getRow(firstRow);
            if (header == null) return List.of();

            int colCount = header.getLastCellNum();
            String[] keys = new String[colCount];
            for (int c = 0; c < colCount; c++) {
                keys[c] = readString(header.getCell(c));
            }

            List<Map<String, Object>> rows = new ArrayList<>();
            for (int r = firstRow + 1; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                Map<String, Object> data = new LinkedHashMap<>();
                boolean hasAny = false;
                for (int c = 0; c < colCount; c++) {
                    String key = keys[c];
                    if (key == null || key.isBlank()) continue;
                    String val = readString(row.getCell(c));
                    if (val != null && !val.isEmpty()) hasAny = true;
                    data.put(key, val);
                }
                if (hasAny) rows.add(data);
            }
            return rows;
        }
    }

    private String readString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return DATE_FMT.format(cell.getDateCellValue());
                }
                double d = cell.getNumericCellValue();
                if (d == Math.floor(d) && !Double.isInfinite(d)) {
                    return String.valueOf((long) d);
                }
                return String.valueOf(d);
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception ex) {
                    try {
                        return String.valueOf(cell.getNumericCellValue());
                    } catch (Exception ignore) {
                        return "";
                    }
                }
            default: return "";
        }
    }
}
