import type { EmployeeShiftData } from './shifts/interface';
import { group1 } from './shifts/group1';
import { group2 } from './shifts/group2';
import { group3 } from './shifts/group3';
import { group4 } from './shifts/group4';

export { type EmployeeShiftData }; // Re-export for other files that might need it

export const shiftsData: EmployeeShiftData[] = [
  ...group1,
  ...group2,
  ...group3,
  ...group4,
];
