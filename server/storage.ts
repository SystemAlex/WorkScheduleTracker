import { EmployeeStorage } from './storage/employees';
import { PositionStorage } from './storage/positions';
import { ShiftStorage } from './storage/shifts';
import { ClientStorage } from './storage/clients';
import { ReportStorage } from './storage/reports';
import { AdminStorage } from './storage/sentinelzone'; // Updated import path
import { UserStorage } from './storage/users'; // New import
import { db } from './db'; // Import db
import { loginHistory } from '@shared/schema'; // Import loginHistory schema

import type {
  Employee,
  Position,
  Cliente,
  InsertEmployee,
  InsertPosition,
  InsertShift,
  InsertCliente,
  ShiftWithDetails,
  InsertMainCompany, // Import new types
  InsertUser, // Import new types
  MainCompany, // Import new types
  User, // Import new types
} from '@shared/schema';
import { EmployeeHoursReport } from '@shared/utils';

export interface IStorage {
  // Employees
  getEmployees(
    nameFilter?: string,
    mainCompanyId?: number,
  ): Promise<Employee[]>;
  getEmployee(
    id: number,
    mainCompanyId?: number,
  ): Promise<Employee | undefined>;
  createEmployee(
    insertEmployee: InsertEmployee,
    mainCompanyId: number,
  ): Promise<Employee>;
  updateEmployee(
    id: number,
    data: InsertEmployee,
    mainCompanyId?: number,
  ): Promise<Employee | null>;
  deleteEmployee(id: number, mainCompanyId?: number): Promise<boolean>;

  // Positions
  getPositions(
    nameFilter?: string,
    mainCompanyId?: number,
  ): Promise<Position[]>;
  createPosition(
    insertPosition: InsertPosition,
    mainCompanyId: number,
  ): Promise<Position>;
  updatePosition(
    id: number,
    data: InsertPosition,
    mainCompanyId?: number,
  ): Promise<Position | null>;
  deletePosition(id: number, mainCompanyId?: number): Promise<boolean>;

  // Shifts
  getShifts(
    startDate?: string,
    endDate?: string,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]>;
  getShiftsByMonth(
    month: number,
    year: number,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]>;
  getShiftsByDate(
    date: string,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]>;
  createShift(
    insertShift: InsertShift,
    mainCompanyId: number,
  ): Promise<ShiftWithDetails>;
  deleteShift(id: number, mainCompanyId?: number): Promise<boolean>;
  checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]>;
  getShiftById(
    id: number,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails | undefined>;
  updateShift(
    id: number,
    data: InsertShift,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails | null>;
  generateShiftsFromPreviousMonth(
    month: number,
    year: number,
    mainCompanyId: number,
  ): Promise<{ count: number }>;

  // Reports
  getEmployeeHoursReport(
    employeeId?: number,
    month?: number,
    year?: number,
    clientId?: number,
    mainCompanyId?: number,
  ): Promise<EmployeeHoursReport[]>;
  generateExcelReport(
    report: EmployeeHoursReport[],
    groupedPositionsByClient: Array<[number, Position[]]>,
    clientes: Cliente[],
    selectedMonth: number,
    selectedYear: number,
    totalReportHours: number,
    totalReportShifts: number,
  ): Promise<Buffer>;
  generatePdfReport(
    report: EmployeeHoursReport[],
    groupedPositionsByClient: Array<[number, Position[]]>,
    clientes: Cliente[],
    selectedMonth: number,
    selectedYear: number,
    totalReportHours: number,
    totalReportShifts: number,
  ): Promise<Buffer>;

  // Clientes
  getClientes(
    searchFilter?: string,
    mainCompanyId?: number,
  ): Promise<Cliente[]>;
  createCliente(data: InsertCliente, mainCompanyId: number): Promise<Cliente>;
  updateCliente(
    id: number,
    data: InsertCliente,
    mainCompanyId?: number,
  ): Promise<Cliente | null>;
  deleteCliente(id: number, mainCompanyId?: number): Promise<boolean>;

  // Admin Operations (New)
  createMainCompanyAndAdminUser(
    companyData: InsertMainCompany,
    userData: Omit<InsertUser, 'role' | 'mainCompanyId'>,
  ): Promise<{ company: MainCompany; adminUser: User }>;
  getMainCompaniesWithAdmins(): Promise<(MainCompany & { users: User[] })[]>;
  updateMainCompany(
    id: number,
    data: Partial<InsertMainCompany> & {
      isActive?: boolean;
      lastPaymentDate?: string | null;
    },
  ): Promise<MainCompany | null>;
  deleteMainCompany(id: number): Promise<boolean>;
  getGlobalStats(): Promise<{
    totalEmployees: number;
    totalClients: number;
    totalShiftsLast30Days: number;
  }>;
  getActiveSessions(): Promise<
    {
      username: string;
      role: string;
      expire: Date;
      companyName: string | null;
    }[]
  >;
  resetAdminPassword(companyId: number): Promise<boolean>;
  recordLogin(
    userId: number,
    mainCompanyId: number | null,
    ipAddress: string,
  ): Promise<void>;
  getLoginHistory(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'month',
  ): Promise<{ date: string; logins: number }[]>;

  // User Management (New)
  getUsers(mainCompanyId: number): Promise<Omit<User, 'passwordHash'>[]>;
  createUser(
    data: Pick<InsertUser, 'username' | 'role'>,
    mainCompanyId: number,
  ): Promise<User>;
  updateUser(
    userId: number,
    data: Pick<InsertUser, 'role'>,
    mainCompanyId: number,
  ): Promise<User | null>;
  deleteUser(
    userId: number,
    mainCompanyId: number,
    currentUserId: number,
  ): Promise<boolean>;
  resetUserPassword(userId: number, mainCompanyId: number): Promise<boolean>;
}

class CombinedStorage implements IStorage {
  private employeeStorage: EmployeeStorage;
  private positionStorage: PositionStorage;
  private shiftStorage: ShiftStorage;
  private clientStorage: ClientStorage;
  private reportStorage: ReportStorage;
  private adminStorage: AdminStorage;
  private userStorage: UserStorage; // New instance

  constructor() {
    this.employeeStorage = new EmployeeStorage();
    this.positionStorage = new PositionStorage();
    this.clientStorage = new ClientStorage();
    this.reportStorage = new ReportStorage();
    this.shiftStorage = new ShiftStorage(
      this.reportStorage,
      this.positionStorage,
    );
    this.adminStorage = new AdminStorage();
    this.userStorage = new UserStorage(); // Initialize new instance
  }

  // Delegate methods to respective storage classes
  // Employees
  getEmployees(nameFilter?: string, mainCompanyId?: number) {
    return this.employeeStorage.getEmployees(nameFilter, mainCompanyId);
  }
  getEmployee(id: number, mainCompanyId?: number) {
    return this.employeeStorage.getEmployee(id, mainCompanyId);
  }
  createEmployee(insertEmployee: InsertEmployee, mainCompanyId: number) {
    return this.employeeStorage.createEmployee(insertEmployee, mainCompanyId);
  }
  updateEmployee(id: number, data: InsertEmployee, mainCompanyId?: number) {
    return this.employeeStorage.updateEmployee(id, data, mainCompanyId);
  }
  deleteEmployee(id: number, mainCompanyId?: number) {
    return this.employeeStorage.deleteEmployee(id, mainCompanyId);
  }

  // Positions
  getPositions(nameFilter?: string, mainCompanyId?: number) {
    return this.positionStorage.getPositions(nameFilter, mainCompanyId);
  }
  createPosition(insertPosition: InsertPosition, mainCompanyId: number) {
    return this.positionStorage.createPosition(insertPosition, mainCompanyId);
  }
  updatePosition(id: number, data: InsertPosition, mainCompanyId?: number) {
    return this.positionStorage.updatePosition(id, data, mainCompanyId);
  }
  deletePosition(id: number, mainCompanyId?: number) {
    return this.positionStorage.deletePosition(id, mainCompanyId);
  }

  // Shifts
  getShifts(startDate?: string, endDate?: string, mainCompanyId?: number) {
    return this.shiftStorage.getShifts(startDate, endDate, mainCompanyId);
  }
  getShiftsByMonth(month: number, year: number, mainCompanyId?: number) {
    return this.shiftStorage.getShiftsByMonth(month, year, mainCompanyId);
  }
  getShiftsByDate(date: string, mainCompanyId?: number) {
    return this.shiftStorage.getShiftsByDate(date, mainCompanyId);
  }
  createShift(insertShift: InsertShift, mainCompanyId: number) {
    return this.shiftStorage.createShift(insertShift, mainCompanyId);
  }
  deleteShift(id: number, mainCompanyId?: number) {
    return this.shiftStorage.deleteShift(id, mainCompanyId);
  }
  checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
    mainCompanyId?: number,
  ) {
    return this.shiftStorage.checkShiftConflicts(
      employeeId,
      date,
      excludeShiftId,
      mainCompanyId,
    );
  }
  getShiftById(id: number, mainCompanyId?: number) {
    return this.shiftStorage.getShiftById(id, mainCompanyId);
  }
  updateShift(id: number, data: InsertShift, mainCompanyId?: number) {
    return this.shiftStorage.updateShift(id, data, mainCompanyId);
  }
  generateShiftsFromPreviousMonth(
    month: number,
    year: number,
    mainCompanyId: number,
  ) {
    return this.shiftStorage.generateShiftsFromPreviousMonth(
      month,
      year,
      mainCompanyId,
    );
  }

  // Reports
  getEmployeeHoursReport(
    employeeId?: number,
    month?: number,
    year?: number,
    clientId?: number,
    mainCompanyId?: number,
  ) {
    return this.reportStorage.getEmployeeHoursReport(
      employeeId,
      month,
      year,
      clientId,
      mainCompanyId,
    );
  }
  generateExcelReport(
    report: EmployeeHoursReport[],
    groupedPositionsByClient: Array<[number, Position[]]>,
    clientes: Cliente[],
    selectedMonth: number,
    selectedYear: number,
    totalReportHours: number,
    totalReportShifts: number,
  ) {
    return this.reportStorage.generateExcelReport(
      report,
      groupedPositionsByClient,
      clientes,
      selectedMonth,
      selectedYear,
      totalReportHours,
      totalReportShifts,
    );
  }
  generatePdfReport(
    report: EmployeeHoursReport[],
    groupedPositionsByClient: Array<[number, Position[]]>,
    clientes: Cliente[],
    selectedMonth: number,
    selectedYear: number,
    totalReportHours: number,
    totalReportShifts: number,
  ) {
    return this.reportStorage.generatePdfReport(
      report,
      groupedPositionsByClient,
      clientes,
      selectedMonth,
      selectedYear,
      totalReportHours,
      totalReportShifts,
    );
  }

  // Clientes
  getClientes(searchFilter?: string, mainCompanyId?: number) {
    return this.clientStorage.getClientes(searchFilter, mainCompanyId);
  }
  createCliente(data: InsertCliente, mainCompanyId: number) {
    return this.clientStorage.createCliente(data, mainCompanyId);
  }
  updateCliente(id: number, data: InsertCliente, mainCompanyId?: number) {
    return this.clientStorage.updateCliente(id, data, mainCompanyId);
  }
  deleteCliente(id: number, mainCompanyId?: number) {
    return this.clientStorage.deleteCliente(id, mainCompanyId);
  }

  // Admin Operations
  createMainCompanyAndAdminUser(
    companyData: InsertMainCompany,
    userData: Omit<InsertUser, 'role' | 'mainCompanyId'>,
  ) {
    return this.adminStorage.createMainCompanyAndAdminUser(
      companyData,
      userData,
    );
  }
  getMainCompaniesWithAdmins() {
    return this.adminStorage.getMainCompaniesWithAdmins();
  }
  updateMainCompany(
    id: number,
    data: Partial<InsertMainCompany> & {
      isActive?: boolean;
      lastPaymentDate?: string | null;
    },
  ) {
    return this.adminStorage.updateMainCompany(id, data);
  }
  deleteMainCompany(id: number) {
    return this.adminStorage.deleteMainCompany(id);
  }
  getGlobalStats() {
    return this.adminStorage.getGlobalStats();
  }
  getActiveSessions() {
    return this.adminStorage.getActiveSessions();
  }
  resetAdminPassword(companyId: number) {
    return this.adminStorage.resetAdminPassword(companyId);
  }
  async recordLogin(
    userId: number,
    mainCompanyId: number | null,
    ipAddress: string,
  ): Promise<void> {
    await db.insert(loginHistory).values({
      userId,
      mainCompanyId,
      ipAddress,
    });
  }
  getLoginHistory(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'month',
  ) {
    return this.adminStorage.getLoginHistory(startDate, endDate, granularity);
  }

  // User Management (New)
  getUsers(mainCompanyId: number) {
    return this.userStorage.getUsers(mainCompanyId);
  }
  createUser(
    data: Pick<InsertUser, 'username' | 'role'>,
    mainCompanyId: number,
  ) {
    return this.userStorage.createUser(data, mainCompanyId);
  }
  updateUser(
    userId: number,
    data: Pick<InsertUser, 'role'>,
    mainCompanyId: number,
  ) {
    return this.userStorage.updateUser(userId, data, mainCompanyId);
  }
  deleteUser(userId: number, mainCompanyId: number, currentUserId: number) {
    return this.userStorage.deleteUser(userId, mainCompanyId, currentUserId);
  }
  resetUserPassword(userId: number, mainCompanyId: number) {
    return this.userStorage.resetUserPassword(userId, mainCompanyId);
  }
}

export const storage = new CombinedStorage();
