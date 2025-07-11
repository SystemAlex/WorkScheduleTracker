import { db } from './db';
import { employees, positions, shifts, clientes } from '@shared/schema';

async function seed() {
  // Limpiar tablas
  await db.delete(shifts);
  await db.delete(employees);
  await db.delete(positions);
  await db.delete(clientes);

  // 1. Insertar clientes
  const clientesAInsertar = [
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
  const clientesInsertados = await db
    .insert(clientes)
    .values(clientesAInsertar)
    .returning();

  // 2. Insertar 10 puestos, varios por cliente
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

  await db.insert(positions).values(puestosAInsertar).returning();

  // 3. Insertar empleados
  await db.insert(employees).values([
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
  ]);

  // Obtener IDs y datos necesarios
  const empleados = await db.select().from(employees);
  const puestosDb = await db.select().from(positions);

  // Generar turnos para el mes actual
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const turnosAInsertar = [];

  for (const empleado of empleados) {
    // Assign a random position to each employee for the seed data
    const randomPosition =
      puestosDb[Math.floor(Math.random() * puestosDb.length)];
    if (!randomPosition) continue; // Should not happen with valid data

    // 5 turnos por semana: Lunes a Viernes
    let diasAsignados = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const fecha = new Date(year, month, day);
      const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

      if (diaSemana >= 1 && diaSemana <= 5) {
        turnosAInsertar.push({
          employeeId: empleado.id,
          positionId: randomPosition.id, // Assign a positionId
          date: fecha.toISOString().slice(0, 10),
          notes: '',
        });
        diasAsignados++;
        if (diasAsignados >= 20) break; // Máximo 20 turnos por mes por empleado
      }
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
