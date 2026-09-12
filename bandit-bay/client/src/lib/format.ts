/** Grosse Zahlen kompakt darstellen (1,2 Mio statt 1200000). */
export function formatCoins(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} Mrd`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} Mio`;
  if (abs >= 100_000) return `${Math.round(value / 1000)} Tsd`;
  return Math.round(value).toLocaleString('de-DE');
}

export function formatFull(value: number): string {
  return Math.round(value).toLocaleString('de-DE');
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'voll';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
