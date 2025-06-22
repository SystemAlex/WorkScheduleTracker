import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  time,
  date,
  varchar,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  position: text('position'),
  status: text('status').notNull().default('active'), // active, inactive
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const positions = pgTable('positions', {
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
});

export const shifts = pgTable('shifts', {
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
});

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  empresa: varchar('empresa', { length: 100 }).notNull(),
  direccion: varchar('direccion', { length: 150 }),
  localidad: varchar('localidad', { length: 100 }),
  nombreContacto: varchar('nombre_contacto', { length: 100 }),
  telefono: varchar('telefono', { length: 30 }),
  email: varchar('email', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  shifts: many(shifts),
}));

export const positionsRelations = relations(positions, ({ many }) => ({
  shifts: many(shifts),
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

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

export const insertClienteSchema = createInsertSchema(clientes)
  .omit({ id: true, createdAt: true })
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
