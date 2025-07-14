import { positionsData } from './data/positions-data';
import { getColor } from '../utils/color-generator';

export function generarPuestos(
  clientesInsertados: { empresa: string; id: number }[],
) {
  const puestosConCliente = positionsData
    .map(([empresa, department, description, siglas, totalHoras]) => {
      const cliente = clientesInsertados.find((c) => c.empresa === empresa);
      if (!cliente) {
        console.warn(
          `[Seed] Cliente no encontrado para la empresa: "${empresa}". Se omitirá el puesto "${description}".`,
        );
        return null;
      }
      const esNoche = description.toLowerCase().includes('noche');

      return {
        name: description,
        siglas,
        department,
        description,
        color: getColor(description, esNoche),
        totalHoras: String(totalHoras),
        clienteId: cliente.id,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return puestosConCliente;
}
