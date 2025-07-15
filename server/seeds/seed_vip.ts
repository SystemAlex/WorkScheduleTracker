import 'dotenv/config'; // Asegura que las variables de entorno se carguen al inicio
import { db } from '../db';
import {
  employees,
  positions,
  shifts,
  clientes,
  mainCompanies,
  users,
} from '@shared/schema';
import { generarPuestos } from './vip/puestos-seeder';
import { shiftsData } from './vip/data/shifts-data';
import bcrypt from 'bcrypt'; // Import bcrypt
import { eq } from 'drizzle-orm';
import { format } from 'date-fns'; // Importar format

async function seed() {
  // No borrar tablas aquí, este seed es para añadir datos a una DB existente o recién migrada.

  // 1. Insertar la empresa principal (Main Company) si no existe
  let mainCompany = (
    await db
      .select()
      .from(mainCompanies)
      .where(eq(mainCompanies.name, 'VIP SRL'))
  )[0];
  if (!mainCompany) {
    [mainCompany] = await db
      .insert(mainCompanies)
      .values({
        name: 'VIP SRL',
        paymentControl: 'monthly', // o 'annual', 'permanent'
        lastPaymentDate: format(new Date(), 'yyyy-MM-dd'), // Usar fecha formateada
        isActive: true, // Ensure it's active
        needsSetup: false, // This company is pre-configured
        country: 'Argentina', // Insert name
        province: 'Misiones', // Insert name
        city: 'Puerto Esperanza', // Default value
        address: 'Av. San Martín 123', // Default value
        taxId: '30-71234567-8', // Default value
        contactName: 'Gerente VIP', // Default value
        phone: '+5493751412345', // Default value
        email: 'contacto@vipsrl.com', // Default value
      })
      .returning();
    console.log(
      `Main Company '${mainCompany.name}' creada con ID: ${mainCompany.id}`,
    );
  } else {
    console.log(`Main Company '${mainCompany.name}' ya existe.`);
  }

  // 2. Insertar el usuario "gerente" (admin) y asociarlo con la Main Company si no existe
  const gerenteUser = (
    await db.select().from(users).where(eq(users.username, 'gerente_vip'))
  )[0];
  if (!gerenteUser) {
    const hashedPassword = await bcrypt.hash('VipSRL2025', 10); // Hash a password
    await db.insert(users).values({
      username: 'gerente_vip',
      passwordHash: hashedPassword,
      role: 'admin', // 'admin' es el rol más cercano a "Gerente"
      mainCompanyId: mainCompany.id,
      mustChangePassword: false, // No forzar cambio de contraseña
    });
    console.log('Usuario "gerente" creado y asociado.');
  } else {
    console.log('Usuario "gerente" ya existe.');
  }

  // No crear usuario SuperAdmin en este seed.

  // 3. Preparar y asociar clientes con la Main Company
  const clientesData = [
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

  const existingClientes = await db
    .select()
    .from(clientes)
    .where(eq(clientes.mainCompanyId, mainCompany.id));
  const existingClienteNames = new Set(existingClientes.map((c) => c.empresa));

  const clientesAInsertar = clientesData
    .filter((c) => !existingClienteNames.has(c.empresa))
    .map((cliente) => ({
      ...cliente,
      mainCompanyId: mainCompany.id,
    }));

  let clientesInsertados: { empresa: string; id: number }[] = [];
  if (clientesAInsertar.length > 0) {
    clientesInsertados = await db
      .insert(clientes)
      .values(clientesAInsertar)
      .returning();
    console.log(
      `${clientesInsertados.length} nuevos clientes insertados y asociados.`,
    );
  } else {
    console.log('No hay nuevos clientes para insertar.');
  }
  // Combine existing and newly inserted clients for position seeding
  const allClientesForPositions = [...existingClientes, ...clientesInsertados];

  // Insertar puestos (sin cambios, ya depende de clientesInsertados)
  const puestosAInsertar = generarPuestos(allClientesForPositions);
  const existingPositions = await db.select().from(positions);
  const existingPositionNames = new Set(existingPositions.map((p) => p.name));

  const newPuestosToInsert = puestosAInsertar.filter(
    (p) => !existingPositionNames.has(p.name),
  );

  let puestosDb: { siglas: string; id: number; name: string }[] = [];
  if (newPuestosToInsert.length > 0) {
    puestosDb = await db
      .insert(positions)
      .values(newPuestosToInsert)
      .returning();
    console.log(`${puestosDb.length} nuevos puestos insertados.`);
  } else {
    console.log('No hay nuevos puestos para insertar.');
  }
  // Combine existing and newly inserted positions for shift seeding
  const allPuestos = [...existingPositions, ...puestosDb];

  // 4. Preparar y asociar empleados con la Main Company
  const employeesData = [
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
  ];

  const existingEmployees = await db
    .select()
    .from(employees)
    .where(eq(employees.mainCompanyId, mainCompany.id));
  const existingEmployeeNames = new Set(existingEmployees.map((e) => e.name));

  const empleadosAInsertar = employeesData
    .filter((e) => !existingEmployeeNames.has(e.name))
    .map((employee) => ({
      ...employee,
      mainCompanyId: mainCompany.id,
    }));

  if (empleadosAInsertar.length > 0) {
    await db.insert(employees).values(empleadosAInsertar);
    console.log(
      `${empleadosAInsertar.length} nuevos empleados insertados y asociados.`,
    );
  } else {
    console.log('No hay nuevos empleados para insertar.');
  }

  // Obtener datos para crear turnos (incluyendo los recién insertados y los existentes)
  const allEmpleados = await db
    .select()
    .from(employees)
    .where(eq(employees.mainCompanyId, mainCompany.id));

  // Indexar puestos por siglas (sin cambios)
  const puestoPorSiglas = Object.fromEntries(
    allPuestos.map((p) => [p.siglas, p]),
  );

  // Crear turnos desde shiftsData
  const turnosAInsertar = [];
  const existingShifts = await db.select().from(shifts);
  const existingShiftKeys = new Set(
    existingShifts.map((s) => `${s.employeeId}-${s.date}-${s.positionId}`),
  );

  const employeeMap = new Map(allEmpleados.map((e) => [e.name, e]));

  for (const employeeShiftData of shiftsData) {
    const empleado = employeeMap.get(employeeShiftData.employeeName);
    if (!empleado) {
      console.warn(
        `[Seed] Empleado no encontrado en la DB: "${employeeShiftData.employeeName}". Se omitirán sus turnos.`,
      );
      continue;
    }

    const turnosEmpleado = employeeShiftData.shifts;
    for (const fecha in turnosEmpleado) {
      const siglasTurno = turnosEmpleado[fecha];
      const puesto = puestoPorSiglas[siglasTurno];
      if (!puesto) {
        // console.warn(
        //   `No se encontró puesto con siglas ${siglasTurno} para empleado ${empleado.name} en ${fecha}`,
        // );
        continue;
      }
      const shiftKey = `${empleado.id}-${fecha}-${puesto.id}`;
      if (!existingShiftKeys.has(shiftKey)) {
        turnosAInsertar.push({
          employeeId: empleado.id,
          positionId: puesto.id,
          date: fecha,
          notes: '',
        });
      }
    }
  }

  if (turnosAInsertar.length > 0) {
    await db.insert(shifts).values(turnosAInsertar);
    console.log(`${turnosAInsertar.length} nuevos turnos insertados.`);
  } else {
    console.log('No hay nuevos turnos para insertar.');
  }

  console.log('Seed completado!');
  // process.exit(0); // No salir para permitir que otros seeds o el servidor continúen
}

seed().catch((err) => {
  console.error('Error durante el proceso de seed:', err);
  // process.exit(1); // No salir para permitir que otros seeds o el servidor continúen
});
