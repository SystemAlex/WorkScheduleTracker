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
  unique,
  boolean, // Import boolean
  json, // Import json type
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Nueva tabla para las empresas principales (Main Clients)
export const mainCompanies = pgTable(
  'main_companies',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    paymentControl: text('payment_control', {
      enum: ['monthly', 'annual', 'permanent'],
    }).notNull(),
    lastPaymentDate: date('last_payment_date'), // CHANGED from timestamp
    isActive: boolean('is_active').notNull().default(true), // New field for active status
    needsSetup: boolean('needs_setup').notNull().default(true), // New field
    country: text('country'), // New field
    province: text('province'), // New field
    city: text('city'), // New field
    address: text('address'), // New field
    taxId: text('tax_id'), // New field for Clave Fiscal
    contactName: text('contact_name'), // New field
    phone: text('phone'), // New field
    email: text('email'), // New field
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      mainCompanyNameIdx: index('main_company_name_idx').on(table.name),
    };
  },
);

// Nueva tabla para los usuarios
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', {
      enum: ['super_admin', 'admin', 'supervisor'],
    }).notNull(),
    mainCompanyId: integer('main_company_id').references(
      () => mainCompanies.id,
      { onDelete: 'set null' },
    ), // Nullable for SuperAdmin
    mustChangePassword: boolean('must_change_password').notNull().default(true), // New field
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      userUsernameIdx: index('user_username_idx').on(table.username),
      userMainCompanyIdIdx: index('user_main_company_id_idx').on(
        table.mainCompanyId,
      ),
    };
  },
);

export const employees = pgTable(
  'employees',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    status: text('status').notNull().default('active'), // active, inactive
    mainCompanyId: integer('main_company_id')
      .notNull()
      .references(() => mainCompanies.id), // Nueva FK a main_companies
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      employeeNameIdx: index('employee_name_idx').on(table.name),
      employeeMainCompanyIdIdx: index('employee_main_company_id_idx').on(
        table.mainCompanyId,
      ),
    };
  },
);

export const positions = pgTable(
  'positions',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
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
      // Unique constraint on name and clienteId to allow same position name for different clients
      uniquePositionNameForClient: unique('unique_position_name_for_client').on(
        table.name,
        table.clienteId,
      ),
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
    mainCompanyId: integer('main_company_id')
      .notNull()
      .references(() => mainCompanies.id), // Nueva FK a main_companies
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'), // New column for soft delete
  },
  (table) => {
    return {
      clienteEmpresaIdx: index('cliente_empresa_idx').on(table.empresa),
      clienteMainCompanyIdIdx: index('cliente_main_company_id_idx').on(
        table.mainCompanyId,
      ),
    };
  },
);

// Tabla para sesiones de connect-pg-simple
export const session = pgTable(
  'session',
  {
    sid: varchar('sid', { length: 255 }).primaryKey(),
    sess: json('sess').notNull(),
    expire: timestamp('expire', { precision: 6, withTimezone: true }).notNull(), // Added withTimezone: true
  },
  (table) => {
    return {
      expireIdx: index('IDX_session_expire').on(table.expire),
    };
  },
);

// Nueva tabla para el historial de inicios de sesión
export const loginHistory = pgTable(
  'login_history',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mainCompanyId: integer('main_company_id').references(
      () => mainCompanies.id,
      { onDelete: 'cascade' },
    ),
    loginTimestamp: timestamp('login_timestamp').notNull().defaultNow(),
    ipAddress: text('ip_address'),
  },
  (table) => {
    return {
      loginHistoryUserIdIdx: index('login_history_user_id_idx').on(
        table.userId,
      ),
      loginHistoryTimestampIdx: index('login_history_timestamp_idx').on(
        table.loginTimestamp,
      ),
    };
  },
);

// Relations
export const mainCompaniesRelations = relations(mainCompanies, ({ many }) => ({
  employees: many(employees),
  clientes: many(clientes),
  users: many(users),
  loginHistory: many(loginHistory), // Nueva relación
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  mainCompany: one(mainCompanies, {
    fields: [users.mainCompanyId],
    references: [mainCompanies.id],
  }),
  loginHistory: many(loginHistory), // Nueva relación
}));

export const employeesRelations = relations(employees, ({ many, one }) => ({
  shifts: many(shifts),
  mainCompany: one(mainCompanies, {
    fields: [employees.mainCompanyId],
    references: [mainCompanies.id],
  }),
}));

export const positionsRelations = relations(positions, ({ many, one }) => ({
  shifts: many(shifts),
  cliente: one(clientes, {
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

export const clientesRelations = relations(clientes, ({ many, one }) => ({
  positions: many(positions),
  mainCompany: one(mainCompanies, {
    fields: [clientes.mainCompanyId],
    references: [mainCompanies.id],
  }),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
  mainCompany: one(mainCompanies, {
    fields: [loginHistory.mainCompanyId],
    references: [mainCompanies.id],
  }),
}));

// Insert schemas
export const insertMainCompanySchema = createInsertSchema(mainCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isActive: true,
  lastPaymentDate: true,
  needsSetup: true, // Omit this new field
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

export const insertClienteSchema = createInsertSchema(clientes)
  .omit({ id: true, createdAt: true, deletedAt: true })
  .extend({
    empresa: z.string().min(1, 'La empresa es obligatoria'),
  });

export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  loginTimestamp: true,
});

// Select schemas
export const mainCompanySchema = createSelectSchema(mainCompanies);
export const userSchema = createSelectSchema(users);
export const clienteSchema = createSelectSchema(clientes);
export const loginHistorySchema = createSelectSchema(loginHistory);

// Types
export type MainCompany = typeof mainCompanies.$inferSelect;
export type InsertMainCompany = z.infer<typeof insertMainCompanySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;

export type LoginHistory = typeof loginHistory.$inferSelect;
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;

// Extended types for API responses
export type ShiftWithDetails = Shift & {
  employee: Employee;
  position: Position;
};
