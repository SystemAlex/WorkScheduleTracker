import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  date,
  varchar,
  decimal,
  index,
  unique, // Import 'unique' here
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const employees = pgTable(
  'employees',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    status: text('status').notNull().default('active'), // active, inactive
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      employeeNameIdx: index('employee_name_idx').on(table.name),
    };
  },
);

export const positions = pgTable(
  'positions',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    department: text('department'),
    siglas: text('siglas').notNull(), // Siglas para mostrar en el calendario
    color: varchar('color', { length: 7 }).notNull(), // HEX
    totalHoras: decimal('total_horas', { precision: 4, scale: 1 }).notNull(), // Puedes usar decimal si tu ORM lo soporta
    clienteId: integer('cliente_id')
      .notNull()
      .references(() => clientes.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'), // New column for soft delete
  },
  (table) => {
    return {
      positionClienteIdIdx: index('position_cliente_id_idx').on(
        table.clienteId,
      ),
      positionNameIdx: index('position_name_idx').on(table.name),
    };
  },
);

export const shifts = pgTable(
  'shifts',
  {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id')
      .notNull()
      .references(() => employees.id),
    positionId: integer('position_id')
      .notNull()
      .references(() => positions.id),
    date: date('date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      shiftEmployeeIdIdx: index('shift_employee_id_idx').on(table.employeeId),
      shiftPositionIdIdx: index('shift_position_id_idx').on(table.positionId),
      shiftDateIdx: index('shift_date_idx').on(table.date),
      // Add a unique constraint for employeeId and date
      uniqueEmployeeDate: unique('unique_employee_date').on(
        table.employeeId,
        table.date,
      ),
    };
  },
);

export const clientes = pgTable(
  'clientes',
  {
    id: serial('id').primaryKey(),
    empresa: varchar('empresa', { length: 100 }).notNull(),
    direccion: varchar('direccion', { length: 150 }),
    localidad: varchar('localidad', { length: 100 }),
    nombreContacto: varchar('nombre_contacto', { length: 100 }),
    telefono: varchar('telefono', { length: 30 }),
    email: varchar('email', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'), // New column for soft delete
  },
  (table) => {
    return {
      clienteEmpresaIdx: index('cliente_empresa_idx').on(table.empresa),
    };
  },
);

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  shifts: many(shifts),
}));

export const positionsRelations = relations(positions, ({ many, one }) => ({
  shifts: many(shifts),
  clientes: one(clientes, {
    fields: [positions.clienteId],
    references: [clientes.id],
  }),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
  employee: one(employees, {
    fields: [shifts.employeeId],
    references: [employees.id],
  }),
  position: one(positions, {
    fields: [shifts.positionId],
    references: [positions.id],
  }),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  positions: many(positions),
}));

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
  deletedAt: true, // Omit deletedAt from insert schema
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

export const insertClienteSchema = createInsertSchema(clientes)
  .omit({ id: true, createdAt: true, deletedAt: true }) // Omit deletedAt from insert schema
  .extend({
    empresa: z.string().min(1, 'La empresa es obligatoria'),
  });

// Select schemas
export const clienteSchema = createSelectSchema(clientes);

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;

// Extended types for API responses
export type ShiftWithDetails = Shift & {
  employee: Employee;
  position: Position;
};