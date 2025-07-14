import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { AlertTriangle, Info, X } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function PaymentStatusBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = React.useState(true);

  if (
    !user ||
    user.role === 'super_admin' ||
    !user.companyStatus ||
    !isVisible
  ) {
    return null;
  }

  const { isActive, isPaymentDueSoon, nextPaymentDueDate } = user.companyStatus;

  // Banner for EXPIRED subscription (isActive is false)
  if (!isActive) {
    return (
      <div className="bg-destructive text-destructive-foreground p-3 flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-3" />
          <p className="font-semibold">
            Tu suscripción ha expirado. Por favor, contacta a soporte para
            reactivar tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  // Banner for subscription DUE SOON (isActive is true, but isPaymentDueSoon is true)
  if (isPaymentDueSoon && nextPaymentDueDate) {
    const today = new Date();
    // The server now sends a full ISO string, so `new Date()` will handle it correctly.
    const dueDate = new Date(nextPaymentDueDate);

    const daysUntilDue = differenceInCalendarDays(dueDate, today);

    // Safeguard: If for some reason daysUntilDue is negative but isActive is still true, don't show a confusing message.
    if (daysUntilDue < 0) {
      return null;
    }

    let message = '';
    const formattedDueDate = format(dueDate, "d 'de' MMMM", { locale: es });

    if (daysUntilDue === 0) {
      message = `¡Atención! Tu suscripción vence hoy. Regulariza el pago para evitar la interrupción del servicio.`;
    } else if (daysUntilDue === 1) {
      message = `Aviso: Tu suscripción vence mañana. La fecha límite es el ${formattedDueDate}.`;
    } else {
      message = `Aviso: Tu suscripción vence en ${daysUntilDue} días. La fecha límite es el ${formattedDueDate}.`;
    }

    const bannerClasses =
      daysUntilDue <= 1
        ? 'bg-destructive text-destructive-foreground'
        : 'bg-yellow-400 text-yellow-900';

    const closeButtonHoverClass =
      daysUntilDue <= 1 ? 'hover:bg-destructive/20' : 'hover:bg-yellow-500/20';

    return (
      <div className={`${bannerClasses} p-3 flex items-center justify-between`}>
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-3" />
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className={`p-1 rounded-full ${closeButtonHoverClass}`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return null;
}
