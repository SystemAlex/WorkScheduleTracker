export function base(path?: string): string {
  let base = '';
  try {
    base = import.meta.env.MODE === 'production' ? '/vipsrl' : '';
  } catch {
    base = process.env.NODE_ENV === 'production' ? '/vipsrl' : ''; // Eliminar la barra final aquí
  }
  return `${base}${path}`;
}
