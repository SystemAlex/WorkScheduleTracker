import { EmployeeStorage } from './storage/employees';
import { PositionStorage } from './storage/positions';
import { ShiftStorage } from './storage/shifts';
import { ClientStorage } from './storage/clients';
import { ReportStorage } from './storage/reports';

import type {
  Employee,
  Position,
  Cliente,
  InsertEmployee,
  InsertPosition,
  InsertShift,
  InsertCliente,
  ShiftWithDetails,
} from '@shared/schema';
import { EmployeeHoursReport } from '@shared/utils';

export interface IStorage {
  // Employees
  getEmployees(nameFilter?: string): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(insertEmployee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: InsertEmployee): Promise<Employee | null>; // Updated return type
  deleteEmployee(id: number): Promise<boolean>; // Updated return type

  // Positions
  getPositions(nameFilter?: string): Promise<Position[]>;
  createPosition(insertPosition: InsertPosition): Promise<Position>;
  updatePosition(id: number, data: InsertPosition): Promise<Position | null>; // Updated return type
  deletePosition(id: number): Promise<boolean>; // Updated return type

  // Shifts
  getShifts(startDate?: string, endDate?: string): Promise<ShiftWithDetails[]>;
  getShiftsByMonth(month: number, year: number): Promise<ShiftWithDetails[]>;
  getShiftsByDate(date: string): Promise<ShiftWithDetails[]>;
  createShift(insertShift: InsertShift): Promise<ShiftWithDetails>;
  deleteShift(id: number): Promise<boolean>; // Updated return type
  checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
  ): Promise<ShiftWithDetails[]>;
  getShiftById(id: number): Promise<ShiftWithDetails | undefined>;
  updateShift(id: number, data: InsertShift): Promise<ShiftWithDetails | null>; // Updated return type
  generateShiftsFromPreviousMonth(
    month: number,
    year: number,
  ): Promise<{ count: number }>;

  // Reports
  getEmployeeHoursReport(
    employeeId?: number,
    month?: number,
    year?: number,
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
  getClientes(searchFilter?: string): Promise<Cliente[]>;
  createCliente(data: InsertCliente): Promise<Cliente>;
  updateCliente(id: number, data: InsertCliente): Promise<Cliente | null>; // Updated return type
  deleteCliente(id: number): Promise<boolean>; // Updated return type
}

class CombinedStorage implements IStorage {
  private employeeStorage: EmployeeStorage;
  private positionStorage: PositionStorage;
  private shiftStorage: ShiftStorage;
  private clientStorage: ClientStorage;
  private reportStorage: ReportStorage;

  constructor() {
    this.employeeStorage = new EmployeeStorage();
    this.positionStorage = new PositionStorage();
    this.clientStorage = new ClientStorage();
    this.reportStorage = new ReportStorage();
    this.shiftStorage = new ShiftStorage(
      this.reportStorage,
      this.positionStorage,
    );
  }

  // Delegate methods to respective storage classes
  // Employees
  getEmployees(nameFilter?: string) {
    return this.employeeStorage.getEmployees(nameFilter);
  }
  getEmployee(id: number) {
    return this.employeeStorage.getEmployee(id);
  }
  createEmployee(insertEmployee: InsertEmployee) {
    return this.employeeStorage.createEmployee(insertEmployee);
  }
  updateEmployee(id: number, data: InsertEmployee) {
    return this.employeeStorage.updateEmployee(id, data);
  }
  deleteEmployee(id: number) {
    return this.employeeStorage.deleteEmployee(id);
  }

  // Positions
  getPositions(nameFilter?: string) {
    return this.positionStorage.getPositions(nameFilter);
  }
  createPosition(insertPosition: InsertPosition) {
    return this.positionStorage.createPosition(insertPosition);
  }
  updatePosition(id: number, data: InsertPosition) {
    return this.positionStorage.updatePosition(id, data);
  }
  deletePosition(id: number) {
    return this.positionStorage.deletePosition(id);
  }

  // Shifts
  getShifts(startDate?: string, endDate?: string) {
    return this.shiftStorage.getShifts(startDate, endDate);
  }
  getShiftsByMonth(month: number, year: number) {
    return this.shiftStorage.getShiftsByMonth(month, year);
  }
  getShiftsByDate(date: string) {
    return this.shiftStorage.getShiftsByDate(date);
  }
  createShift(insertShift: InsertShift) {
    return this.shiftStorage.createShift(insertShift);
  }
  deleteShift(id: number) {
    return this.shiftStorage.deleteShift(id);
  }
  checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
  ) {
    return this.shiftStorage.checkShiftConflicts(
      employeeId,
      date,
      excludeShiftId,
    );
  }
  getShiftById(id: number) {
    return this.shiftStorage.getShiftById(id);
  }
  updateShift(id: number, data: InsertShift) {
    return this.shiftStorage.updateShift(id, data);
  }
  generateShiftsFromPreviousMonth(month: number, year: number) {
    return this.shiftStorage.generateShiftsFromPreviousMonth(month, year);
  }

  // Reports
  getEmployeeHoursReport(employeeId?: number, month?: number, year?: number) {
    return this.reportStorage.getEmployeeHoursReport(employeeId, month, year);
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
  getClientes(searchFilter?: string) {
    return this.clientStorage.getClientes(searchFilter);
  }
  createCliente(data: InsertCliente) {
    return this.clientStorage.createCliente(data);
  }
  updateCliente(id: number, data: InsertCliente) {
    return this.clientStorage.updateCliente(id, data);
  }
  deleteCliente(id: number) {
    return this.clientStorage.deleteCliente(id);
  }
}

export const storage = new CombinedStorage();