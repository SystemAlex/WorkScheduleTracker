const colores = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#84CC16',
  '#22C55E',
  '#06B6D4',
  '#0EA5E9',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#A855F7',
  '#3B82F6',
  '#10B981',
  '#E11D48',
];

const coloresNoche = [
  '#991B1B',
  '#78350F',
  '#92400E',
  '#365314',
  '#14532D',
  '#164E63',
  '#1E3A8A',
  '#4C1D95',
  '#701A75',
  '#334155',
];

export function getColor(nombre: string, esNoche: boolean): string {
  const hash = Array.from(nombre).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  return esNoche
    ? coloresNoche[hash % coloresNoche.length]
    : colores[hash % colores.length];
}
