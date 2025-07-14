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
import bcrypt from 'bcrypt'; // Import bcrypt
import { Country, State } from 'country-state-city'; // Import Country and State
import { format } from 'date-fns'; // Importar format

async function seed() {
  // Limpiar tablas en el orden correcto para evitar errores de FK
  await db.delete(shifts);
  await db.delete(employees);
  await db.delete(positions);
  await db.delete(users);
  await db.delete(clientes);
  await db.delete(mainCompanies);

  console.log('Tablas limpiadas.');

  // Obtener nombres de país y provincia para insertar
  const argentina = Country.getAllCountries().find((c) => c.isoCode === 'AR');
  const buenosAires = State.getStatesOfCountry('AR').find(
    (s) => s.isoCode === 'BA',
  );

  // 1. Insertar la empresa principal "Empresa Demo"
  const [mainCompany] = await db
    .insert(mainCompanies)
    .values({
      name: 'Empresa Demo',
      paymentControl: 'permanent', // Set to permanent
      lastPaymentDate: format(new Date(), 'yyyy-MM-dd'), // Usar fecha formateada
      isActive: true, // Ensure it's active
      needsSetup: false, // This company is pre-configured
      country: argentina?.name || 'Argentina', // Insert name
      province: buenosAires?.name || 'Buenos Aires', // Insert name
      city: 'CABA',
      address: 'Av. Corrientes 1234',
      taxId: '20-12345678-9',
      contactName: 'Juan Demo',
      phone: '+5491112345678',
      email: 'contacto@empresademo.com',
    })
    .returning();

  console.log(
    `Main Company '${mainCompany.name}' creada con ID: ${mainCompany.id}`,
  );

  // 2. Insertar el usuario "demo_admin" (admin) y asociarlo
  const hashedPassword = await bcrypt.hash('password123', 10); // Hash a password for the admin user
  await db.insert(users).values({
    username: 'demo_admin',
    passwordHash: hashedPassword,
    role: 'admin',
    mainCompanyId: mainCompany.id,
    mustChangePassword: false, // No forzar cambio de contraseña
  });

  console.log('Usuario "demo_admin" creado y asociado.');

  // 2.1. Insertar un usuario SuperAdmin (sin mainCompanyId)
  const superAdminHashedPassword = await bcrypt.hash('superadmin123', 10); // Hash a password for the super admin
  await db.insert(users).values({
    username: 'superadmin',
    passwordHash: superAdminHashedPassword,
    role: 'super_admin',
    mainCompanyId: null, // SuperAdmin is not tied to a specific mainCompany
    mustChangePassword: false, // No forzar cambio de contraseña
  });

  console.log('Usuario "superadmin" (SuperAdmin) creado.');

  // 3. Preparar y asociar clientes con la Main Company
  const clientesData = [
    {
      empresa: 'Empresa Uno',
      direccion: 'Calle 1',
      localidad: 'Ciudad A',
      nombreContacto: 'Juan Cliente',
      telefono: '111-111',
      email: 'uno@empresa.com',
    },
    {
      empresa: 'Empresa Dos',
      direccion: 'Calle 2',
      localidad: 'Ciudad B',
      nombreContacto: 'Ana Cliente',
      telefono: '222-222',
      email: 'dos@empresa.com',
    },
    {
      empresa: 'Empresa Tres',
      direccion: 'Calle 3',
      localidad: 'Ciudad C',
      nombreContacto: 'Carlos Cliente',
      telefono: '333-333',
      email: 'tres@empresa.com',
    },
    {
      empresa: 'Empresa Cuatro',
      direccion: 'Calle 4',
      localidad: 'Ciudad D',
      nombreContacto: 'María Cliente',
      telefono: '444-444',
      email: 'cuatro@empresa.com',
    },
    {
      empresa: 'Empresa Cinco',
      direccion: 'Calle 5',
      localidad: 'Ciudad E',
      nombreContacto: 'Pedro Cliente',
      telefono: '555-555',
      email: 'cinco@empresa.com',
    },
  ];

  const clientesAInsertar = clientesData.map((cliente) => ({
    ...cliente,
    mainCompanyId: mainCompany.id, // Asociar con Main Company
  }));

  const clientesInsertados = await db
    .insert(clientes)
    .values(clientesAInsertar)
    .returning();

  console.log(`${clientesInsertados.length} clientes insertados y asociados.`);

  // 4. Insertar puestos (sin cambios, ya depende de clientesInsertados)
  const puestosAInsertar = [
    // Cliente 1
    {
      name: 'Recepcionista',
      siglas: 'REC',
      department: 'Administración',
      description: 'Atiende la recepción',
      color: '#3B82F6',
      totalHoras: '8',
      clienteId: clientesInsertados[0].id,
    },
    {
      name: 'Seguridad',
      siglas: 'SEG',
      department: 'Operaciones',
      description: 'Vigila el edificio',
      color: '#22C55E',
      totalHoras: '8',
      clienteId: clientesInsertados[0].id,
    },
    // Cliente 2
    {
      name: 'Limpieza',
      siglas: 'LIM',
      department: 'Servicios',
      description: 'Limpieza general',
      color: '#F59E42',
      totalHoras: '6',
      clienteId: clientesInsertados[1].id,
    },
    {
      name: 'Administrativo',
      siglas: 'ADM',
      department: 'Administración',
      description: 'Tareas administrativas',
      color: '#A855F7',
      totalHoras: '7.5',
      clienteId: clientesInsertados[1].id,
    },
    // Cliente 3
    {
      name: 'Mantenimiento',
      siglas: 'MAN',
      department: 'Operaciones',
      description: 'Mantenimiento técnico',
      color: '#F43F5E',
      totalHoras: '8',
      clienteId: clientesInsertados[2].id,
    },
    {
      name: 'Cajero',
      siglas: 'CAJ',
      department: 'Finanzas',
      description: 'Atiende la caja',
      color: '#0EA5E9',
      totalHoras: '8',
      clienteId: clientesInsertados[2].id,
    },
    // Cliente 4
    {
      name: 'Supervisor',
      siglas: 'SUP',
      department: 'Operaciones',
      description: 'Supervisa el personal',
      color: '#FBBF24',
      totalHoras: '8',
      clienteId: clientesInsertados[3].id,
    },
    {
      name: 'Soporte IT',
      siglas: 'IT',
      department: 'Tecnología',
      description: 'Soporte técnico',
      color: '#6366F1',
      totalHoras: '7',
      clienteId: clientesInsertados[3].id,
    },
    // Cliente 5
    {
      name: 'Recursos Humanos',
      siglas: 'RRHH',
      department: 'Administración',
      description: 'Gestión de personal',
      color: '#10B981',
      totalHoras: '7.5',
      clienteId: clientesInsertados[4].id,
    },
    {
      name: 'Logística',
      siglas: 'LOG',
      department: 'Logística',
      description: 'Gestión de envíos',
      color: '#EF4444',
      totalHoras: '8',
      clienteId: clientesInsertados[4].id,
    },
  ];

  const puestosDb = await db
    .insert(positions)
    .values(puestosAInsertar)
    .returning();
  console.log(`${puestosDb.length} puestos insertados.`);

  // 5. Preparar y asociar empleados con la Main Company
  const employeesData = [
    {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '111111111',
      status: 'active',
    },
    {
      name: 'Ana Gómez',
      email: 'ana@example.com',
      phone: '222222222',
      status: 'active',
    },
    {
      name: 'Carlos Ruiz',
      email: 'carlos@example.com',
      phone: '333333333',
      status: 'active',
    },
    {
      name: 'María López',
      email: 'maria@example.com',
      phone: '444444444',
      status: 'active',
    },
    {
      name: 'Pedro Sánchez',
      email: 'pedro@example.com',
      phone: '555555555',
      status: 'active',
    },
    {
      name: 'Lucía Torres',
      email: 'lucia@example.com',
      phone: '666666666',
      status: 'active',
    },
    {
      name: 'Miguel Díaz',
      email: 'miguel@example.com',
      phone: '777777777',
      status: 'active',
    },
    {
      name: 'Sofía Romero',
      email: 'sofia@example.com',
      phone: '888888888',
      status: 'active',
    },
    {
      name: 'Diego Fernández',
      email: 'diego@example.com',
      phone: '999999999',
      status: 'active',
    },
    {
      name: 'Valentina Castro',
      email: 'valentina@example.com',
      phone: '101010101',
      status: 'active',
    },
  ];

  const empleadosAInsertar = employeesData.map((employee) => ({
    ...employee,
    mainCompanyId: mainCompany.id, // Asociar con Main Company
  }));

  await db.insert(employees).values(empleadosAInsertar);
  console.log(`${empleadosAInsertar.length} empleados insertados y asociados.`);

  // Obtener IDs y datos para generar turnos
  const empleados = await db.select().from(employees);

  // Generar turnos para el mes actual
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const turnosAInsertar = [];

  for (const empleado of empleados) {
    const randomPosition =
      puestosDb[Math.floor(Math.random() * puestosDb.length)];
    if (!randomPosition) continue;

    let diasAsignados = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const fecha = new Date(year, month, day);
      const diaSemana = fecha.getDay();

      if (diaSemana >= 1 && diaSemana <= 5) {
        turnosAInsertar.push({
          employeeId: empleado.id,
          positionId: randomPosition.id,
          date: fecha.toISOString().slice(0, 10),
          notes: '',
        });
        diasAsignados++;
        if (diasAsignados >= 20) break;
      }
    }
  }

  if (turnosAInsertar.length > 0) {
    await db.insert(shifts).values(turnosAInsertar);
    console.log(`${turnosAInsertar.length} turnos insertados.`);
  }

  console.log('Seed completado!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error durante el proceso de seed:', err);
  process.exit(1);
});
