import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { db } from '../db'; // Import db
import { users, mainCompanies } from '@shared/schema'; // Import mainCompanies schema
import { eq } from 'drizzle-orm';
import {
  addMonths,
  addYears,
  isBefore, // Importar isBefore
  isSameDay, // Importar isSameDay
  startOfDay,
  parse, // Importar parse
  differenceInCalendarDays, // Importar la función que faltaba
} from 'date-fns'; // Importar utilidades de fecha

// Extend the Request type to include session and user information
declare module 'express-session' {
  interface SessionData {
    userId: number;
    mainCompanyId?: number | null; // This means number | null | undefined
    role?: 'super_admin' | 'admin' | 'supervisor';
    isPendingPasswordChange?: boolean; // New flag
  }
}

/**
 * Middleware to check if the user is authenticated.
 * Fetches the user from the database using the session's userId,
 * and populates req.user and req.mainCompanyId.
 * This ensures all subsequent middlewares have the full, up-to-date user context.
 */
export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.session || !req.session.userId) {
    return next(
      new UnauthorizedError('You must be logged in to access this resource.'),
    );
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));

    if (!user) {
      // If user is not found, the session is invalid. Destroy it.
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        res.clearCookie('connect.sid');
        return next(
          new UnauthorizedError('Invalid session. Please log in again.'),
        );
      });
      return;
    }

    // Attach full user object and mainCompanyId to the request
    req.user = user;
    req.mainCompanyId = user.mainCompanyId;

    // Synchronize session with the database state.
    // This is crucial for the checkPasswordChangeStatus middleware.
    req.session.isPendingPasswordChange = user.mustChangePassword;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize access based on user role.
 */
export const authorizeRole = (
  roles: Array<'super_admin' | 'admin' | 'supervisor'>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return next(new UnauthorizedError('User role not found.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          'You do not have permission to perform this action.',
        ),
      );
    }
    next();
  };
};

/**
 * Middleware to ensure the user has access to the requested mainCompanyId.
 * SuperAdmin can access all companies.
 */
export const authorizeCompany = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // SuperAdmin can access all companies, so no specific mainCompanyId check is needed for them.
  if (req.user?.role === 'super_admin') {
    return next();
  }

  // For 'admin' and 'supervisor' roles, mainCompanyId must be present in the session.
  if (req.mainCompanyId === undefined || req.mainCompanyId === null) {
    return next(
      new ForbiddenError('No main company associated with your session.'),
    );
  }

  // If a specific mainCompanyId is requested in the path/query, ensure it matches the user's mainCompanyId.
  // This part needs to be implemented in the routes themselves, by passing req.mainCompanyId to storage methods.
  // This middleware primarily ensures req.mainCompanyId is set for non-super_admin users.
  next();
};

/**
 * Middleware to check the payment status of the main company and block access if necessary.
 * This middleware should run AFTER isAuthenticated and authorizeCompany.
 */
export const checkCompanyPaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // SuperAdmin is exempt from payment checks
  if (req.user?.role === 'super_admin') {
    return next();
  }

  const mainCompanyId = req.mainCompanyId;

  // If mainCompanyId is not set (should be caught by authorizeCompany, but for safety)
  if (mainCompanyId === undefined || mainCompanyId === null) {
    return next(
      new ForbiddenError('No main company associated with your account.'),
    );
  }

  try {
    const [company] = await db
      .select()
      .from(mainCompanies)
      .where(eq(mainCompanies.id, mainCompanyId));

    if (!company) {
      return next(new ForbiddenError('Associated company not found.'));
    }

    // --- Start of REVISED calculation logic ---
    const now = startOfDay(new Date());
    let isCompanyActiveBasedOnPayment: boolean;
    let nextPaymentDueDate: Date | null = null;
    let isPaymentDueSoon = false;

    if (!company.lastPaymentDate) {
      // If no payment has ever been registered, the company is inactive, regardless of plan.
      isCompanyActiveBasedOnPayment = false;
    } else {
      // A payment has been registered, now check based on plan.
      const lastPayment = parse(
        company.lastPaymentDate,
        'yyyy-MM-dd',
        new Date(),
      );

      switch (company.paymentControl) {
        case 'permanent':
          isCompanyActiveBasedOnPayment = true; // A payment was made, so it's permanently active.
          nextPaymentDueDate = null;
          break;
        case 'monthly':
          nextPaymentDueDate = startOfDay(addMonths(lastPayment, 1));
          isCompanyActiveBasedOnPayment =
            isBefore(now, nextPaymentDueDate) ||
            isSameDay(now, nextPaymentDueDate);
          break;
        case 'annual':
          nextPaymentDueDate = startOfDay(addYears(lastPayment, 1));
          isCompanyActiveBasedOnPayment =
            isBefore(now, nextPaymentDueDate) ||
            isSameDay(now, nextPaymentDueDate);
          break;
        default:
          isCompanyActiveBasedOnPayment = false;
          nextPaymentDueDate = null;
          break;
      }
    }

    // The final active status depends on BOTH the manual `isActive` flag AND the payment date calculation.
    const finalIsActive = company.isActive && isCompanyActiveBasedOnPayment;

    if (finalIsActive && nextPaymentDueDate) {
      // Only check for due soon if the company is currently active
      const daysUntilDue = differenceInCalendarDays(nextPaymentDueDate, now);
      if (daysUntilDue >= 0 && daysUntilDue <= 5) {
        isPaymentDueSoon = true;
      }
    }
    // --- End of REVISED calculation logic ---

    // Attach the calculated status to the request object.
    // This will be used by the /me endpoint.
    req.mainCompanyPaymentStatus = {
      isActive: finalIsActive,
      paymentControl: company.paymentControl,
      lastPaymentDate: company.lastPaymentDate,
      nextPaymentDueDate: nextPaymentDueDate,
      isPaymentDueSoon: isPaymentDueSoon,
      needsSetup: company.needsSetup,
    };

    // If the request is for the /me endpoint, ALWAYS allow it to proceed.
    // The frontend will use the attached status to decide what to show.
    if (req.baseUrl === '/api/auth' && req.path === '/me') {
      return next();
    }

    // For ALL OTHER endpoints, if the company is not active, block the request.
    if (!finalIsActive) {
      return next(
        new ForbiddenError(
          'Your company subscription is inactive. Please contact support.',
        ),
      );
    }

    // If the company is active, allow the request to proceed.
    next();
  } catch (error) {
    next(error);
  }
};
