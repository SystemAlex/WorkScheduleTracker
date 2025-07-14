export function base(path?: string): string {
  const base = import.meta.env.MODE === 'production' ? '/vipsrl' : '';
  return `${base}${path || ''}`;
}