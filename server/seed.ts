import { db } from './db';
import { employees, positions, shifts, clientes } from '@shared/schema';
import { generarPuestos, turnosPorEmpleado } from './seed_puestos';

async function seed() {
  // Limpiar tablas
  await db.delete(shifts);
  await db.delete(employees);
  await db.delete(positions);
  await db.delete(clientes);

  // Insertar clientes
  const clientesAInsertar = [
    {
      empresa: 'VIP SRL',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'CASA SCHERER',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'PINDO SRL',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'ASERRADERO BRANDESTETTER',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'ASERRADERO ROCA',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'CABLE VIDEO IMAGEN (CVI)',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'HOTEL ORQUIDEAS',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'SUP.COOP',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'SECADERO GUATAMBU',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'SECADERO LAHARRAGUE',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
    {
      empresa: 'FABRICA FECULA',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
  ];

  const clientesInsertados = await db
    .insert(clientes)
    .values(clientesAInsertar)
    .returning();

  // Insertar puestos
  const puestosAInsertar = generarPuestos(clientesInsertados);
  await db.insert(positions).values(puestosAInsertar).returning();

  // Insertar empleados
  await db.insert(employees).values([
    { name: 'ESPINDOLA RODRIGO', status: 'active' },
    { name: 'BENÍTEZ JORGE', status: 'active' },
    { name: 'FERNANDES MATIAS', status: 'active' },
    { name: 'DENIS RICHARD', status: 'active' },
    { name: 'FERREYRA LUIS', status: 'active' },
    { name: 'GONZALEZ JULIO', status: 'active' },
    { name: 'MARTINEZ ARTEMIO', status: 'active' },
    { name: 'SANCHEZ ROLANDO', status: 'active' },
    { name: 'BRITEZ JUAN CARLOS', status: 'active' },
    { name: 'MERELES MANUEL', status: 'active' },
    { name: 'GARCIA ANDRES', status: 'active' },
    { name: 'BENITEZ RAUL ALEJANDRO', status: 'active' },
    { name: 'DE LEON JAVIER', status: 'active' },
    { name: 'FONSECA MARCELO', status: 'active' },
    { name: 'LOPEZ RAMON', status: 'active' },
    { name: 'TAPIA PATRICIO', status: 'active' },
    { name: 'DIAZ EDUARDO', status: 'active' },
    { name: 'ALVARENGA MATIAS', status: 'active' },
    { name: 'WALTER CARLOS', status: 'active' },
    { name: 'GONZALEZ JUAN', status: 'active' },
    { name: 'BENITEZ DIEGO FABIAN', status: 'active' },
    { name: 'BENÍTEZ FABIAN', status: 'active' },
    { name: 'RIQUELME MIGUEL A.', status: 'active' },
    { name: 'MARTINEZ SILVIO', status: 'active' },
    { name: 'LEDEZMA FELICIANO', status: 'active' },
    { name: 'WISNIEWSKI MARCELO', status: 'active' },
    { name: 'DIAZ FABIAN', status: 'active' },
    { name: 'LOPEZ HECTOR', status: 'active' },
    { name: 'MELO DANIEL', status: 'active' },
    { name: 'QUIÑONES UBALDO', status: 'active' },
    { name: 'AYALA CESAR', status: 'active' },
    { name: 'BRITEZ HUGO', status: 'active' },
    { name: 'DUARTE DENIS MANUEL', status: 'active' },
    { name: 'OVIEDO BRIANA', status: 'active' },
    { name: 'ANDINO VENNCIA', status: 'active' },
    { name: 'BRITEZ TAMARA', status: 'active' },
    { name: 'RICARDO LOVERA', status: 'active' },
  ]);

  // Obtener datos
  const empleados = await db.select().from(employees);
  const puestosDb = await db.select().from(positions);

  // Indexar puestos por siglas
  const puestoPorSiglas = Object.fromEntries(
    puestosDb.map((p) => [p.siglas, p]),
  );

  // Crear turnos desde turnosPorEmpleado
  const turnosAInsertar = [];

  for (const empleado of empleados) {
    const turnosEmpleado = turnosPorEmpleado[empleado.name];
    if (!turnosEmpleado) continue;

    for (const fecha in turnosEmpleado) {
      const siglasTurno = turnosEmpleado[fecha];
      const puesto = puestoPorSiglas[siglasTurno];
      if (!puesto) {
        console.warn(
          `No se encontró puesto con siglas ${siglasTurno} para empleado ${empleado.name} en ${fecha}`,
        );
        continue;
      }
      turnosAInsertar.push({
        employeeId: empleado.id,
        positionId: puesto.id,
        date: fecha,
        notes: '',
      });
    }
  }

  await db.insert(shifts).values(turnosAInsertar);

  console.log('Seed completado!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
