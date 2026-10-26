const AI_LITERACY_REPORT_CATALOG_KEY = 'gr:ai-literacy-report-catalog.v1';

export const AI_LITERACY_REPORT_CATALOG_EVENT = 'gr:ai-literacy-report-catalog-change';

export function loadAiLiteracyReportCatalog() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(AI_LITERACY_REPORT_CATALOG_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAiLiteracyReportToCatalog(report) {
  if (!report || typeof window === 'undefined') return [];
  const current = loadAiLiteracyReportCatalog();
  const next = [
    report,
    ...current.filter((item) => item?.id !== report.id && item?.fileName !== report.fileName),
  ].slice(0, 20);
  try {
    window.localStorage.setItem(AI_LITERACY_REPORT_CATALOG_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(AI_LITERACY_REPORT_CATALOG_EVENT, { detail: report }));
  } catch {
    // Keep the page usable when local storage is unavailable.
  }
  return next;
}

