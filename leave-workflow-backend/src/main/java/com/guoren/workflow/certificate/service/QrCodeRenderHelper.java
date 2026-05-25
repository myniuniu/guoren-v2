package com.guoren.workflow.certificate.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.util.HashMap;
import java.util.Map;

/**
 * 二维码渲染辅助服务（E2）
 */
@Slf4j
@Service
public class QrCodeRenderHelper {

    /** 生成二维码 BufferedImage（黑白） */
    public BufferedImage generate(String content, int size, String errorCorrection) {
        if (content == null || content.isBlank()) return null;
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);
        hints.put(EncodeHintType.ERROR_CORRECTION, parseErrorCorrection(errorCorrection));
        try {
            int s = Math.max(64, size);
            BitMatrix matrix = new MultiFormatWriter().encode(content, BarcodeFormat.QR_CODE, s, s, hints);
            return MatrixToImageWriter.toBufferedImage(matrix);
        } catch (WriterException e) {
            log.warn("生成二维码失败 content={} ", content, e);
            return null;
        }
    }

    private ErrorCorrectionLevel parseErrorCorrection(String s) {
        if (s == null) return ErrorCorrectionLevel.M;
        switch (s.toUpperCase()) {
            case "L": return ErrorCorrectionLevel.L;
            case "Q": return ErrorCorrectionLevel.Q;
            case "H": return ErrorCorrectionLevel.H;
            default: return ErrorCorrectionLevel.M;
        }
    }
}
