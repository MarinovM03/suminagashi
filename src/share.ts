// Chrome also checks the file extension, so the probe needs one.
export function canShareFiles(type: string) {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
  const ext = type.split('/')[1];
  try {
    return navigator.canShare({ files: [new File([''], `probe.${ext}`, { type })] });
  } catch {
    return false;
  }
}

export async function shareFile(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file], title: 'Suminagashi', text: `Made with Suminagashi — ${location.origin}` });
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return false;
    throw e;
  }
}
