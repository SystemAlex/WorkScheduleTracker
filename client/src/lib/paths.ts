export function withBase(path: string): string {
  const base = import.meta.env.MODE === 'production' ? '/vipsrl' : '';
  return `${base}${path}`;
}

export function getApiUrl(path: string): string {
  const base = import.meta.env.MODE === 'production' ? '/vipsrl' : '';
  return `${base}${path}`;
}
