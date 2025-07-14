import { User, MainCompany } from '@shared/schema'; // Import MainCompany type

declare module 'express' {
  interface Request {
    user?: User;
    mainCompanyId?: number | null;
    mainCompanyPaymentStatus?: {
      // New property
      isActive: boolean;
      paymentControl: MainCompany['paymentControl'];
      lastPaymentDate: string | null; // Corrected type to string | null
      nextPaymentDueDate: Date | null;
      isPaymentDueSoon: boolean;
      needsSetup: boolean;
    };
  }
}

// Extend express-session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    mainCompanyId?: number | null;
    role?: 'super_admin' | 'admin' | 'supervisor';
    isPendingPasswordChange?: boolean; // New flag
  }
}
