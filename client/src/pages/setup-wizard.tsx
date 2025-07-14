import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { WizardLayout } from '@/components/setup-wizard/wizard-layout';
import { WizardStepper } from '@/components/setup-wizard/wizard-stepper';
import { CreateUsersStep } from '@/components/setup-wizard/create-users-step';
import { CreateEmployeesStep } from '@/components/setup-wizard/create-employees-step';
import { CreateClientsStep } from '@/components/setup-wizard/create-clients-step';
import { CreatePositionsStep } from '@/components/setup-wizard/create-positions-step';
import { SetPasswordStep } from '@/components/setup-wizard/set-password-step';
import { useAuth } from '@/context/auth-context';

const steps = [
  'Contraseña',
  'Bienvenida',
  'Usuarios',
  'Empleados',
  'Clientes',
  'Puestos',
  'Finalizar',
];

export default function SetupWizardPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(
    user?.mustChangePassword ? 0 : 1,
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const completeSetupMutation = useMutation({
    mutationFn: () => apiRequest('PUT', '/api/auth/complete-setup'),
    onSuccess: () => {
      toast({
        title: 'Configuración Finalizada',
        description: '¡Todo listo! Ya puedes empezar a usar la aplicación.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `No se pudo finalizar la configuración: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handleFinish = () => completeSetupMutation.mutate();

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <SetPasswordStep onNext={handleNext} />;
      case 1:
        return (
          <div className="text-center">
            <p className="mb-6 text-neutral-600">
              Puedes seguir este asistente para crear tus primeros usuarios,
              empleados, clientes y puestos, o puedes saltar este paso y hacerlo
              más tarde desde el panel principal.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleFinish}
                disabled={completeSetupMutation.isPending}
              >
                {completeSetupMutation.isPending
                  ? 'Cargando...'
                  : 'Saltar por ahora'}
              </Button>
              <Button onClick={handleNext}>Comenzar Asistente</Button>
            </div>
          </div>
        );
      case 2:
        return <CreateUsersStep onNext={handleNext} onSkip={handleNext} />;
      case 3:
        return <CreateEmployeesStep onNext={handleNext} onSkip={handleNext} />;
      case 4:
        return <CreateClientsStep onNext={handleNext} onSkip={handleNext} />;
      case 5:
        return <CreatePositionsStep onNext={handleNext} onSkip={handleNext} />;
      default:
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">
              ¡Configuración Completada!
            </h2>
            <p className="mb-6">
              Has finalizado la configuración inicial. Ahora puedes acceder al
              panel principal.
            </p>
            <Button
              onClick={handleFinish}
              disabled={completeSetupMutation.isPending}
            >
              Ir al Panel Principal
            </Button>
          </div>
        );
    }
  };

  return (
    <WizardLayout
      title={
        currentStep === 1
          ? '¡Bienvenido a HorariosPro!'
          : `Paso ${currentStep}: ${steps[currentStep]}`
      }
      description={
        currentStep === 1
          ? 'Vamos a configurar tu empresa para que puedas empezar a gestionar los horarios.'
          : 'Sigue los pasos para configurar tu cuenta.'
      }
    >
      <div className="my-8 flex justify-center">
        <WizardStepper steps={steps} currentStep={currentStep} />
      </div>
      {renderStepContent()}
    </WizardLayout>
  );
}
