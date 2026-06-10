package com.guoren.workflow.solution.service;

import java.util.Locale;
import java.util.UUID;

final class SolutionModuleSupport {

    private SolutionModuleSupport() {
    }

    static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    static boolean hasText(String value) {
        return trimToNull(value) != null;
    }

    static String generateCode(String prefix) {
        String normalized = prefix == null ? "CODE" : prefix.trim().toUpperCase(Locale.ROOT);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return normalized + "-" + suffix;
    }
}
