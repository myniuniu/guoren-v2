package com.guoren.workflow.certificate.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guoren.workflow.certificate.entity.CertificateTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

/**
 * 证书渲染服务：将模板 + 用户数据渲染成 PNG / JPG 字节流。
 * v1.1：新增 日期格式化(E1) / 二维码(E2) / 自动编号(E4) / 自定义属性识别(C3)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateRenderService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CertificateSeqService seqService;
    private final QrCodeRenderHelper qrCodeRenderHelper;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    /** 渲染并返回指定格式的字节数组 */
    public byte[] renderToFormat(CertificateTemplate template, Map<String, Object> data,
                                 String format, Float quality) throws IOException {
        BufferedImage img = renderImage(template, data);
        String fmt = (format == null ? "png" : format.toLowerCase());
        if ("jpg".equals(fmt) || "jpeg".equals(fmt)) {
            return toJpgBytes(img, quality == null ? 0.92f : Math.max(0.1f, Math.min(1f, quality)));
        }
        return toPngBytes(img);
    }

    /** 渲染单张证书，返回 PNG 字节数组（兼容旧调用） */
    public byte[] render(CertificateTemplate template, Map<String, Object> data) throws IOException {
        return toPngBytes(renderImage(template, data));
    }

    /** 渲染单张证书 BufferedImage */
    public BufferedImage renderImage(CertificateTemplate template, Map<String, Object> data) throws IOException {
        int width = template.getWidth() == null ? 1123 : template.getWidth();
        int height = template.getHeight() == null ? 794 : template.getHeight();

        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        try {
            // 抗锯齿
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);

            // 1. 白底
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, width, height);

            // 2. 底图
            String bgUrl = template.getBgUrl();
            if (bgUrl != null && !bgUrl.isBlank()) {
                BufferedImage bg = loadAnyImage(bgUrl);
                if (bg != null) {
                    g.drawImage(bg, 0, 0, width, height, null);
                }
            }

            // 3. 解析画布 JSON
            String canvasJson = template.getCanvasJson();
            if (canvasJson == null || canvasJson.isBlank()) {
                return img;
            }

            JsonNode root = objectMapper.readTree(canvasJson);
            JsonNode objects = root.get("objects");
            if (objects == null || !objects.isArray()) {
                return img;
            }

            for (JsonNode obj : objects) {
                String type = obj.path("type").asText("");
                String elementType = obj.path("elementType").asText("");
                if ("qrcode".equalsIgnoreCase(elementType)) {
                    drawQrCode(g, obj, data);
                } else if (isTextType(type)) {
                    drawText(g, obj, data);
                } else if ("Image".equalsIgnoreCase(type) || "image".equalsIgnoreCase(type)) {
                    drawImage(g, obj);
                }
            }
        } finally {
            g.dispose();
        }
        return img;
    }

    private boolean isTextType(String type) {
        if (type == null) return false;
        String t = type.toLowerCase();
        return t.equals("itext") || t.equals("i-text") || t.equals("text") || t.equals("textbox");
    }

    private void drawText(Graphics2D g, JsonNode obj, Map<String, Object> data) {
        String elementType = obj.path("elementType").asText("text");
        String dynamicType = obj.path("dynamicType").asText("");
        String formatPattern = obj.path("formatPattern").asText("");
        String text;
        if ("field".equals(elementType)) {
            String fieldKey = obj.path("fieldKey").asText("");
            Object v = data == null ? null : data.get(fieldKey);
            text = v == null ? "" : String.valueOf(v);
            if (!formatPattern.isEmpty()) {
                text = applyDateFormat(text, formatPattern);
            }
        } else if ("date".equals(dynamicType)) {
            // E1：日期字段
            String pattern = formatPattern.isEmpty() ? "yyyy-MM-dd" : formatPattern;
            try {
                text = DateTimeFormatter.ofPattern(pattern).format(LocalDateTime.now());
            } catch (Exception e) {
                text = LocalDate.now().toString();
            }
        } else if ("autoSeq".equals(dynamicType)) {
            // E4：自动编号
            String ruleKey = obj.path("seqRuleKey").asText("default");
            try {
                text = seqService.next(ruleKey);
            } catch (Exception e) {
                log.warn("生成证书编号失败 ruleKey={}", ruleKey, e);
                text = obj.path("text").asText("");
            }
        } else {
            text = obj.path("text").asText("");
        }

        // 通用格式化：prefix/suffix/textTransform/padZero/numberFormat
        text = applyTextFormat(text, obj);

        if (text == null || text.isEmpty()) return;

        double left = obj.path("left").asDouble(0);
        double top = obj.path("top").asDouble(0);
        double scaleX = obj.path("scaleX").asDouble(1.0);
        double scaleY = obj.path("scaleY").asDouble(1.0);
        double angle = obj.path("angle").asDouble(0);

        int fontSize = (int) Math.round(obj.path("fontSize").asDouble(24) * scaleY);
        String fontFamily = obj.path("fontFamily").asText("Microsoft YaHei");
        String fontWeight = obj.path("fontWeight").asText("normal");
        String fontStyle = obj.path("fontStyle").asText("normal");
        String fillStr = obj.path("fill").asText("#000000");
        String textAlign = obj.path("textAlign").asText("left");
        boolean underline = obj.path("underline").asBoolean(false);
        boolean linethrough = obj.path("linethrough").asBoolean(false);

        int style = Font.PLAIN;
        if ("bold".equalsIgnoreCase(fontWeight) || obj.path("fontWeight").asInt(0) >= 700) {
            style |= Font.BOLD;
        }
        if ("italic".equalsIgnoreCase(fontStyle)) {
            style |= Font.ITALIC;
        }

        Font font = resolveFont(fontFamily, style, fontSize);
        g.setFont(font);
        g.setColor(parseColor(fillStr));

        FontMetrics fm = g.getFontMetrics();
        int textWidth = fm.stringWidth(text);
        int ascent = fm.getAscent();

        // 应用 textAlign 调整 x 起点
        // fabric 中 left/top 默认对应对象包围盒左上角；textAlign 在对象内部生效
        double drawLeft = left;
        if ("center".equalsIgnoreCase(textAlign)) {
            double objWidth = obj.path("width").asDouble(textWidth) * scaleX;
            drawLeft = left + (objWidth - textWidth) / 2.0;
        } else if ("right".equalsIgnoreCase(textAlign)) {
            double objWidth = obj.path("width").asDouble(textWidth) * scaleX;
            drawLeft = left + (objWidth - textWidth);
        }

        // 旋转
        if (Math.abs(angle) > 0.001) {
            Graphics2D g2 = (Graphics2D) g.create();
            g2.rotate(Math.toRadians(angle), left, top);
            g2.setFont(font);
            g2.setColor(parseColor(fillStr));
            g2.drawString(text, (float) drawLeft, (float) (top + ascent));
            drawTextDecorations(g2, drawLeft, top, ascent, textWidth, fontSize, underline, linethrough);
            g2.dispose();
        } else {
            g.drawString(text, (float) drawLeft, (float) (top + ascent));
            drawTextDecorations(g, drawLeft, top, ascent, textWidth, fontSize, underline, linethrough);
        }
    }

    private void drawTextDecorations(Graphics2D g, double x, double y, int ascent, int width,
                                     int fontSize, boolean underline, boolean linethrough) {
        Stroke old = g.getStroke();
        g.setStroke(new BasicStroke(Math.max(1f, fontSize / 16f)));
        if (underline) {
            int yLine = (int) Math.round(y + ascent + 2);
            g.drawLine((int) x, yLine, (int) (x + width), yLine);
        }
        if (linethrough) {
            int yLine = (int) Math.round(y + ascent * 0.6);
            g.drawLine((int) x, yLine, (int) (x + width), yLine);
        }
        g.setStroke(old);
    }

    /** 绘制二维码（E2） */
    private void drawQrCode(Graphics2D g, JsonNode obj, Map<String, Object> data) {
        String qrSource = obj.path("qrSource").asText("static");
        String content;
        if ("field".equals(qrSource)) {
            String fieldKey = obj.path("fieldKey").asText("");
            Object v = data == null ? null : data.get(fieldKey);
            content = v == null ? "" : String.valueOf(v);
        } else {
            content = obj.path("qrContent").asText("");
        }
        if (content == null || content.isEmpty()) return;

        double left = obj.path("left").asDouble(0);
        double top = obj.path("top").asDouble(0);
        double scaleX = obj.path("scaleX").asDouble(1.0);
        double scaleY = obj.path("scaleY").asDouble(1.0);
        int size = (int) Math.round(obj.path("size").asDouble(120));
        int drawW = (int) Math.round(size * scaleX);
        int drawH = (int) Math.round(size * scaleY);
        String ec = obj.path("errorCorrection").asText("M");
        double angle = obj.path("angle").asDouble(0);

        try {
            BufferedImage qr = qrCodeRenderHelper.generate(content, Math.max(drawW, drawH), ec);
            if (Math.abs(angle) > 0.001) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.rotate(Math.toRadians(angle), left, top);
                g2.drawImage(qr, (int) left, (int) top, drawW, drawH, null);
                g2.dispose();
            } else {
                g.drawImage(qr, (int) left, (int) top, drawW, drawH, null);
            }
        } catch (Exception e) {
            log.warn("渲染二维码失败 content={}", content, e);
        }
    }

    /**
     * 通用文本格式化：依次应用 numberFormat → padZero → textTransform → prefix/suffix
     *  - numberFormat: 数值格式化字符串（如 #,##0.00 / 0.00%），仅当 text 是纯数字时生效
     *  - padZero: 数字左侧补零位数（如 4 → 0001）
     *  - textTransform: none / upper / lower / capitalize
     *  - prefix / suffix: 文本前后缀
     */
    private String applyTextFormat(String text, JsonNode obj) {
        if (text == null) text = "";
        // 1. 数值格式化（仅对纯数字有效）
        String numberFormat = obj.path("numberFormat").asText("");
        if (!numberFormat.isEmpty() && !text.isEmpty()) {
            try {
                double num = Double.parseDouble(text);
                text = new java.text.DecimalFormat(numberFormat).format(num);
            } catch (Exception ignore) {}
        }
        // 2. 补零（仅对纯整数/数字有效）
        int padZero = obj.path("padZero").asInt(0);
        if (padZero > 0 && !text.isEmpty()) {
            try {
                long num = Long.parseLong(text.replaceAll("[^0-9-]", ""));
                text = String.format("%0" + padZero + "d", num);
            } catch (Exception ignore) {}
        }
        // 3. 大小写变换
        String transform = obj.path("textTransform").asText("");
        if (!transform.isEmpty()) {
            switch (transform) {
                case "upper":
                    text = text.toUpperCase();
                    break;
                case "lower":
                    text = text.toLowerCase();
                    break;
                case "capitalize":
                    if (!text.isEmpty()) {
                        text = Character.toUpperCase(text.charAt(0)) + text.substring(1);
                    }
                    break;
                default:
                    break;
            }
        }
        // 4. 前后缀（仅当 text 非空时拼接，避免空文本被前缀污染）
        if (!text.isEmpty()) {
            String prefix = obj.path("prefix").asText("");
            String suffix = obj.path("suffix").asText("");
            if (!prefix.isEmpty()) text = prefix + text;
            if (!suffix.isEmpty()) text = text + suffix;
        }
        return text;
    }

    /** 把字符串按格式 pattern 重格式化（容错：解析失败原样返回） */
    private String applyDateFormat(String text, String pattern) {
        if (text == null || text.isEmpty()) return text;
        try {
            // 数字时间戳
            if (text.matches("^\\d{10,13}$")) {
                long ts = Long.parseLong(text);
                if (text.length() == 10) ts *= 1000;
                LocalDateTime ldt = LocalDateTime.ofInstant(
                        new java.util.Date(ts).toInstant(), java.time.ZoneId.systemDefault());
                return DateTimeFormatter.ofPattern(pattern).format(ldt);
            }
            // ISO 日期
            if (text.length() >= 10 && text.charAt(4) == '-') {
                if (text.length() == 10) {
                    return DateTimeFormatter.ofPattern(pattern).format(LocalDate.parse(text));
                }
                String norm = text.replace('T', ' ');
                return DateTimeFormatter.ofPattern(pattern).format(
                        LocalDateTime.parse(norm, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            }
        } catch (Exception ignore) {}
        return text;
    }

    private void drawImage(Graphics2D g, JsonNode obj) {
        String src = obj.path("src").asText("");
        if (src == null || src.isEmpty()) return;

        BufferedImage image = null;
        try {
            if (src.startsWith("data:image")) {
                int comma = src.indexOf(',');
                if (comma > 0) {
                    byte[] bytes = Base64.getDecoder().decode(src.substring(comma + 1));
                    image = ImageIO.read(new ByteArrayInputStream(bytes));
                }
            } else if (src.startsWith("http://") || src.startsWith("https://")) {
                image = ImageIO.read(new java.net.URL(src));
            } else {
                image = loadLocalImage(src);
            }
        } catch (Exception e) {
            log.warn("加载证书图片失败 src={}", src, e);
        }
        if (image == null) return;

        double left = obj.path("left").asDouble(0);
        double top = obj.path("top").asDouble(0);
        double width = obj.path("width").asDouble(image.getWidth())
                * obj.path("scaleX").asDouble(1.0);
        double height = obj.path("height").asDouble(image.getHeight())
                * obj.path("scaleY").asDouble(1.0);
        double angle = obj.path("angle").asDouble(0);

        if (Math.abs(angle) > 0.001) {
            Graphics2D g2 = (Graphics2D) g.create();
            g2.rotate(Math.toRadians(angle), left, top);
            g2.drawImage(image, (int) left, (int) top, (int) width, (int) height, null);
            g2.dispose();
        } else {
            g.drawImage(image, (int) left, (int) top, (int) width, (int) height, null);
        }
    }

    private BufferedImage loadLocalImage(String url) {
        try {
            // url 形如 /uploads/certificates/xxx.png
            String relative = url;
            if (relative.startsWith("/uploads/")) {
                relative = relative.substring("/uploads/".length());
            } else if (relative.startsWith("uploads/")) {
                relative = relative.substring("uploads/".length());
            }
            File f = new File(uploadDir, relative);
            if (!f.exists()) {
                log.warn("证书底图文件不存在: {}", f.getAbsolutePath());
                return null;
            }
            return ImageIO.read(f);
        } catch (IOException e) {
            log.warn("读取本地图片失败 url={}", url, e);
            return null;
        }
    }

    /** 统一加载入口：支持 dataURL / http(s) / 本地路径 */
    private BufferedImage loadAnyImage(String src) {
        if (src == null || src.isBlank()) return null;
        try {
            if (src.startsWith("data:image")) {
                // SVG 仅前端预览使用，后端 PNG 渲染不支持（ImageIO 不识别 SVG）
                if (src.startsWith("data:image/svg")) {
                    log.info("后端 PNG 渲染跳过 SVG 背景图（仅前端可见）");
                    return null;
                }
                int comma = src.indexOf(',');
                if (comma > 0) {
                    byte[] bytes = Base64.getDecoder().decode(src.substring(comma + 1));
                    return ImageIO.read(new ByteArrayInputStream(bytes));
                }
                return null;
            }
            if (src.startsWith("http://") || src.startsWith("https://")) {
                return ImageIO.read(new java.net.URL(src));
            }
            return loadLocalImage(src);
        } catch (Exception e) {
            log.warn("加载图片失败 src 前50字={}", src.length() > 50 ? src.substring(0, 50) : src, e);
            return null;
        }
    }

    private Color parseColor(String s) {
        if (s == null || s.isBlank()) return Color.BLACK;
        try {
            String c = s.trim();
            if (c.startsWith("rgba")) {
                String body = c.substring(c.indexOf('(') + 1, c.lastIndexOf(')'));
                String[] parts = body.split(",");
                int r = Integer.parseInt(parts[0].trim());
                int gg = Integer.parseInt(parts[1].trim());
                int b = Integer.parseInt(parts[2].trim());
                int a = parts.length > 3 ? (int) Math.round(Double.parseDouble(parts[3].trim()) * 255) : 255;
                return new Color(r, gg, b, a);
            }
            if (c.startsWith("rgb")) {
                String body = c.substring(c.indexOf('(') + 1, c.lastIndexOf(')'));
                String[] parts = body.split(",");
                return new Color(
                        Integer.parseInt(parts[0].trim()),
                        Integer.parseInt(parts[1].trim()),
                        Integer.parseInt(parts[2].trim()));
            }
            if (c.startsWith("#")) {
                if (c.length() == 4) {
                    // #rgb -> #rrggbb
                    c = "#" + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2)
                            + c.charAt(3) + c.charAt(3);
                }
                return Color.decode(c);
            }
            return Color.decode(c);
        } catch (Exception e) {
            return Color.BLACK;
        }
    }

    /** 根据 fontFamily 选择系统已安装字体，未命中则回退 SansSerif，避免中文乱码 */
    private Font resolveFont(String fontFamily, int style, int size) {
        Set<String> available = getAvailableFontFamilies();
        String[] candidates;
        if (fontFamily == null || fontFamily.isBlank()) {
            candidates = new String[]{"Microsoft YaHei", "PingFang SC", "SimSun", "SansSerif"};
        } else {
            candidates = new String[]{fontFamily, "Microsoft YaHei", "PingFang SC", "SimSun", "SansSerif"};
        }
        for (String c : candidates) {
            if (c != null && available.contains(c)) {
                return new Font(c, style, size);
            }
        }
        return new Font(Font.SANS_SERIF, style, size);
    }

    private Set<String> availableFamiliesCache;

    private synchronized Set<String> getAvailableFontFamilies() {
        if (availableFamiliesCache == null) {
            Set<String> set = new HashSet<>();
            String[] arr = GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames();
            for (String n : arr) set.add(n);
            availableFamiliesCache = set;
        }
        return availableFamiliesCache;
    }

    private byte[] toPngBytes(BufferedImage img) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", out);
        return out.toByteArray();
    }

    /** JPG 输出（带质量），ARGB 先转 RGB 避免黑底 */
    private byte[] toJpgBytes(BufferedImage img, float quality) throws IOException {
        BufferedImage rgb = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, img.getWidth(), img.getHeight());
        g.drawImage(img, 0, 0, null);
        g.dispose();

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(rgb, "jpg", out);
            return out.toByteArray();
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            writer.write(null, new javax.imageio.IIOImage(rgb, null, null), param);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }
}
