let pendingResourceLibraryEntry = null;

export function setPendingResourceLibraryEntry(entry) {
  pendingResourceLibraryEntry = entry || null;
}

export function peekPendingResourceLibraryEntry() {
  return pendingResourceLibraryEntry;
}

export function clearPendingResourceLibraryEntry(requestId) {
  if (!requestId || pendingResourceLibraryEntry?.requestId === requestId) {
    pendingResourceLibraryEntry = null;
  }
}
