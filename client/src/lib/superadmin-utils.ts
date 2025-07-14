import {
  addMonths,
  addYears,
  isAfter,
  startOfDay,
  differenceInCalendarDays,
  parse,
} from 'date-fns';
import type { MainCompany, User } from '@shared/schema';

export interface CompanyWithCalculatedStatus extends MainCompany {
  users: User[];
  isPaymentDueSoon: boolean;
  isOverdue: boolean;
  hasNoPaymentRegistered: boolean;
}

export function calculateCompanyStatuses(
  companies: (MainCompany & { users: User[] })[],
): CompanyWithCalculatedStatus[] {
  const now = startOfDay(new Date());
  return companies.map((company) => {
    let nextPaymentDueDate: Date | null = null;
    let isOverdue = false;
    let isPaymentDueSoon = false;
    const hasNoPaymentRegistered = !company.lastPaymentDate;

    const effectivePaymentStartDate = company.lastPaymentDate
      ? parse(company.lastPaymentDate, 'yyyy-MM-dd', new Date())
      : company.createdAt;

    switch (company.paymentControl) {
      case 'permanent':
        isOverdue = hasNoPaymentRegistered;
        nextPaymentDueDate = null;
        break;
      case 'monthly':
        nextPaymentDueDate = startOfDay(
          addMonths(effectivePaymentStartDate, 1),
        );
        isOverdue = isAfter(now, nextPaymentDueDate);
        break;
      case 'annual':
        nextPaymentDueDate = startOfDay(addYears(effectivePaymentStartDate, 1));
        isOverdue = isAfter(now, nextPaymentDueDate);
        break;
      default:
        isOverdue = true;
        nextPaymentDueDate = null;
        break;
    }

    // Check for "due soon" only if the company is not already overdue
    if (!isOverdue && nextPaymentDueDate) {
      const daysUntilDue = differenceInCalendarDays(nextPaymentDueDate, now);
      if (daysUntilDue >= 0 && daysUntilDue <= 5) {
        isPaymentDueSoon = true;
      }
    }

    return {
      ...company,
      // We no longer override isActive. We pass it through directly from the DB.
      isPaymentDueSoon,
      isOverdue,
      hasNoPaymentRegistered,
    };
  });
}
