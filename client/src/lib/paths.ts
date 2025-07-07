// export function base(path?: string): string {
//   const base = import.meta.env.MODE === 'production' ? '/vipsrl' : '';
//   return `${base}${path}`;
// }
export function base(path = ''): string {
  const prefix = '/vipsrl';
  const isProd = import.meta.env.MODE === 'production';

  // Si no estamos en producción, devolvemos el path tal cual
  if (!isProd) return path;

  // Si ya empieza con /vipsrl, lo dejamos como está
  return path.startsWith(prefix) ? path : `${prefix}${path}`;
}
