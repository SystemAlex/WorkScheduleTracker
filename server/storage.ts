import { EmployeeStorage } from './storage/employees';
import { PositionStorage } from './storage/positions';
import { ShiftStorage } from './storage/shifts';
import { ClientStorage } from './storage/clients';
import { ReportStorage } from './storage/reports';

import type {
  Employee,
  Position,
  Shift,
  Cliente,
  InsertEmployee,
  InsertPosition,
  InsertShift,
  InsertCliente,
  ShiftWithDetails,
} from '@shared/schema';

export interface IStorage {
  // Employees
  getEmployees(nameFilter?: string): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(insertEmployee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: InsertEmployee): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Positions
  getPositions(nameFilter?: string): Promise<Position[]>;
  createPosition(insertPosition: InsertPosition): Promise<Position>;
  updatePosition(id: number, data: InsertPosition): Promise<Position>; // Added
  deletePosition(id: number): Promise<void>; // Added

  // Shifts
  getShifts(startDate?: string, endDate?: string): Promise<ShiftWithDetails[]>;
  getShiftsByMonth(month: number, year: number): Promise<ShiftWithDetails[]>;
  getShiftsByDate(date: string): Promise<ShiftWithDetails[]>;
  createShift(insertShift: InsertShift): Promise<ShiftWithDetails>;
  deleteShift(id: number): Promise<void>;
  checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
  ): Promise<ShiftWithDetails[]>;
  getShiftById(id: number): Promise<ShiftWithDetails | undefined>;
  updateShift(id: number, data: InsertShift): Promise<ShiftWithDetails>;
  generateShiftsFromPreviousMonth(
    month: number,
    year: number,
  ): Promise<{ count: number }>;

  // Reports
  getEmployeeHoursReport(
    employeeId?: number,
    month?: number,
    year?: number,
  ): Promise<any[]>;

  // Clientes
  getClientes(searchFilter?: string): Promise<Cliente[]>;
  createCliente(data: InsertCliente): Promise<Cliente>;
  updateCliente(id: number, data: InsertCliente): Promise<Cliente>;
  deleteCliente(id: number): Promise<void>;
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
    // ShiftStorage depends on ReportStorage and PositionStorage
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
  updatePosition(id: number, data: InsertPosition) { // Delegated
    return this.positionStorage.updatePosition(id, data);
  }
  deletePosition(id: number) { // Delegated
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