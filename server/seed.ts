import { db } from './db';
import { employees, positions, shiftTypes, shifts } from '@shared/schema';

async function seed() {
  // Limpiar tablas
  await db.delete(shifts);
  await db.delete(employees);
  await db.delete(positions);
  await db.delete(shiftTypes);

  // 1. Insertar puestos
  await db
    .insert(positions)
    .values([
      { name: 'Recepcionista', siglas: 'REC', department: 'Administración', description: 'Atiende la recepción' },
      { name: 'Seguridad', siglas: 'SEG', department: 'Operaciones', description: 'Vigila el edificio' },
      { name: 'Limpieza', siglas: 'LIM', department: 'Servicios', description: 'Limpieza general' },
      { name: 'Administrativo', siglas: 'ADM', department: 'Administración', description: 'Tareas administrativas' },
      { name: 'Mantenimiento', siglas: 'MAN', department: 'Operaciones', description: 'Mantenimiento técnico' },
    ])
    .returning();

  // 2. Insertar empleados
  await db.insert(employees).values([
    { name: 'Juan Pérez', email: 'juan@example.com', phone: '111111111', position: 'Recepcionista', status: 'active' },
    { name: 'Ana Gómez', email: 'ana@example.com', phone: '222222222', position: 'Seguridad', status: 'active' },
    { name: 'Carlos Ruiz', email: 'carlos@example.com', phone: '333333333', position: 'Limpieza', status: 'active' },
    { name: 'María López', email: 'maria@example.com', phone: '444444444', position: 'Administrativo', status: 'active' },
    { name: 'Pedro Sánchez', email: 'pedro@example.com', phone: '555555555', position: 'Mantenimiento', status: 'active' },
    { name: 'Lucía Torres', email: 'lucia@example.com', phone: '666666666', position: 'Recepcionista', status: 'active' },
    { name: 'Miguel Díaz', email: 'miguel@example.com', phone: '777777777', position: 'Seguridad', status: 'active' },
    { name: 'Sofía Romero', email: 'sofia@example.com', phone: '888888888', position: 'Limpieza', status: 'active' },
    { name: 'Diego Fernández', email: 'diego@example.com', phone: '999999999', position: 'Administrativo', status: 'active' },
    { name: 'Valentina Castro', email: 'valentina@example.com', phone: '101010101', position: 'Mantenimiento', status: 'active' },
  ]);

  // 3. Insertar tipos de turno
  await db.insert(shiftTypes).values([
    { name: 'Mañana', code: 'M', startTime: '06:00', endTime: '14:00', color: '#3B82F6' },
    { name: 'Tarde', code: 'T', startTime: '14:00', endTime: '22:00', color: '#22C55E' },
  ]);

  // Obtener IDs y datos necesarios
  const empleados = await db.select().from(employees);
  const puestos = await db.select().from(positions);
  const tiposTurno = await db.select().from(shiftTypes);

  // Mapas para lookup rápido
  const puestoPorNombre = Object.fromEntries(puestos.map(p => [p.name, p]));
  const tipoTurnoPorCodigo = Object.fromEntries(tiposTurno.map(t => [t.code, t]));

  // Generar turnos para el mes actual
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const turnosAInsertar = [];

  for (const empleado of empleados) {
    // 5 turnos por semana: Lunes a Viernes
    let diasAsignados = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const fecha = new Date(year, month, day);
      const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

      if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
        // Alternar tipo de turno entre Mañana y Tarde
        const tipoTurno = diaSemana % 2 === 0 ? tipoTurnoPorCodigo['M'] : tipoTurnoPorCodigo['T'];
        const puesto = empleado.position ? puestoPorNombre[empleado.position] : undefined;

        if (tipoTurno && puesto) {
          turnosAInsertar.push({
            employeeId: empleado.id,
            positionId: puesto.id,
            shiftTypeId: tipoTurno.id,
            date: fecha.toISOString().slice(0, 10),
            notes: '',
          });
          diasAsignados++;
        }
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