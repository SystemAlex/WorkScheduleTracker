import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  time,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shiftTypes = pgTable('shift_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(), // M, T, N, E
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  color: text('color').notNull(), // hex color code
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
  shiftTypeId: integer('shift_type_id')
    .notNull()
    .references(() => shiftTypes.id),
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  shifts: many(shifts),
}));

export const positionsRelations = relations(positions, ({ many }) => ({
  shifts: many(shifts),
}));

export const shiftTypesRelations = relations(shiftTypes, ({ many }) => ({
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
  shiftType: one(shiftTypes, {
    fields: [shifts.shiftTypeId],
    references: [shiftTypes.id],
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

export const insertShiftTypeSchema = createInsertSchema(shiftTypes).omit({
  id: true,
  createdAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type ShiftType = typeof shiftTypes.$inferSelect;
export type InsertShiftType = z.infer<typeof insertShiftTypeSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

// Extended types for API responses
export type ShiftWithDetails = Shift & {
  employee: Employee;
  position: Position;
  shiftType: ShiftType;
};
