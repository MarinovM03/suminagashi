const pad = (n: number) => String(n).padStart(2, '0');

export function stampedName(ext: string, at = new Date()) {
  const date = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  const time = `${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`;
  return `suminagashi-${date}-${time}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  // revoking early can cut off a large download
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
