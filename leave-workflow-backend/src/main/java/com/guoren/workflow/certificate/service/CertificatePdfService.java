package com.guoren.workflow.certificate.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * 证书 PDF 导出服务（F1）
 * 把渲染好的 PNG BufferedImage 嵌入到 PDF 单页中
 */
@Slf4j
@Service
public class CertificatePdfService {

    public byte[] toPdf(byte[] pngBytes, int width, int height) throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(new PDRectangle(width, height));
            doc.addPage(page);

            // 直接以 PNG 流注入 PDF（PDFBox 自动转为图片对象）
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(pngBytes));
            PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, pngBytes, "cert.png");

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.drawImage(pdImage, 0, 0, width, height);
            }
            // 仅为消除 BufferedImage 未使用警告（如失败也不影响）
            if (img == null) log.debug("png decode null");

            doc.save(out);
            return out.toByteArray();
        }
    }
}
