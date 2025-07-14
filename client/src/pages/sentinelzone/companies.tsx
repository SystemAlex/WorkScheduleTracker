import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { CompanyList } from '@/components/sentinelzone/company-list';
import type { MainCompany, User } from '@shared/schema';
import { calculateCompanyStatuses } from '@/lib/superadmin-utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  EditCompanyForm,
  EditCompanyFormValues,
  formSchema as editFormSchema,
} from '@/components/sentinelzone/edit-company-form';
import {
  CreateCompanyForm,
  CreateCompanyFormValues,
  formSchema as createFormSchema,
} from '@/components/sentinelzone/create-company-form'; // Import CreateCompanyForm and its schema
import { RegisterPaymentDialog } from '@/components/sentinelzone/register-payment-dialog'; // New import
import { format } from 'date-fns';
import { SearchInput } from '@/components/common/search-input';

type CompanyWithAdmins = MainCompany & { users: User[] };

export default function CompaniesPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRegisterPaymentModalOpen, setIsRegisterPaymentModalOpen] =
    useState(false); // New state
  const [editingCompany, setEditingCompany] = useState<MainCompany | null>(
    null,
  );
  const [companyToRegisterPaymentFor, setCompanyToRegisterPaymentFor] =
    useState<MainCompany | null>(null); // New state
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery<CompanyWithAdmins[]>({
    queryKey: ['/api/sentinelzone/main-companies'],
  });

  const companiesWithStatus = React.useMemo(() => {
    const calculated = calculateCompanyStatuses(companies);
    if (!searchTerm) {
      return calculated;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return calculated.filter(
      (company) =>
        company.name.toLowerCase().includes(lowercasedSearchTerm) ||
        company.paymentControl.toLowerCase().includes(lowercasedSearchTerm) ||
        company.users.some((user) =>
          user.username.toLowerCase().includes(lowercasedSearchTerm),
        ),
    );
  }, [companies, searchTerm]);

  // Form for editing an existing company
  const editForm = useForm<EditCompanyFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: '',
      paymentControl: 'monthly',
      isActive: true,
      lastPaymentDate: null,
    },
  });

  // Form for creating a new company
  const createForm = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      companyName: '',
      paymentControl: 'monthly',
      country: '',
      province: '',
      city: '',
      address: '',
      taxId: '',
      contactName: '',
      phone: '',
      email: '',
      adminUsername: '',
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CreateCompanyFormValues) => {
      const payload = {
        company: {
          name: data.companyName,
          paymentControl: data.paymentControl,
          country: data.country || null,
          province: data.province || null,
          city: data.city || null,
          address: data.address || null,
          taxId: data.taxId || null,
          contactName: data.contactName || null,
          phone: data.phone || null,
          email: data.email || null,
        },
        adminUser: {
          username: data.adminUsername,
        },
      };
      const response = await apiRequest(
        'POST',
        '/api/sentinelzone/main-companies',
        payload,
      );
      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(
          responseBody.message || 'Error inesperado al crear la empresa.',
        );
      }
      return responseBody;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/sentinelzone/main-companies'],
      });
      setIsCreateModalOpen(false); // Close create modal
      createForm.reset(); // Reset create form
      toast({
        title: 'Empresa Creada',
        description:
          'La nueva empresa y su administrador han sido registrados.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la empresa.',
        variant: 'destructive',
      });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: EditCompanyFormValues;
    }) => {
      const response = await apiRequest(
        'PUT',
        `/api/sentinelzone/main-companies/${id}`,
        data,
      );
      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(
          responseBody.message || 'Error inesperado al actualizar la empresa.',
        );
      }
      return responseBody;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/sentinelzone/main-companies'],
      });
      setIsEditModalOpen(false); // Close edit modal
      setEditingCompany(null);
      editForm.reset(); // Reset edit form
      toast({
        title: 'Empresa Actualizada',
        description: 'La empresa ha sido actualizada correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la empresa.',
        variant: 'destructive',
      });
    },
  });

  const registerPaymentMutation = useMutation({
    mutationFn: async ({
      id,
      paymentDate,
    }: {
      id: number;
      paymentDate: Date;
    }) => {
      const formattedDate = format(paymentDate, 'yyyy-MM-dd');
      const response = await apiRequest(
        'PUT',
        `/api/sentinelzone/main-companies/${id}`,
        {
          lastPaymentDate: formattedDate,
          isActive: true,
        },
      );
      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(
          responseBody.message || 'Error inesperado al registrar el pago.',
        );
      }
      return responseBody;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/sentinelzone/main-companies'],
      });
      setIsRegisterPaymentModalOpen(false);
      setCompanyToRegisterPaymentFor(null);
      toast({
        title: 'Pago Registrado',
        description: 'La fecha de último pago ha sido actualizada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el pago.',
        variant: 'destructive',
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        'DELETE',
        `/api/sentinelzone/main-companies/${id}`,
      );
      if (!response.ok) {
        const responseBody = await response.json();
        throw new Error(
          responseBody.message || 'Error inesperado al eliminar la empresa.',
        );
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/sentinelzone/main-companies'],
      });
      toast({
        title: 'Empresa Eliminada',
        description: 'La empresa ha sido eliminada correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la empresa.',
        variant: 'destructive',
      });
    },
  });

  const resetAdminPasswordMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await apiRequest(
        'PUT',
        `/api/sentinelzone/main-companies/${companyId}/reset-admin-password`,
      );
      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(
          responseBody.message ||
            'Error inesperado al restablecer la contraseña.',
        );
      }
      return responseBody;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/sentinelzone/main-companies'],
      });
      toast({
        title: 'Contraseña Restablecida',
        description:
          'La contraseña del administrador ha sido restablecida a "resetPass1234".',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo restablecer la contraseña.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (company: MainCompany) => {
    setEditingCompany(company);

    // The date from the DB is already a 'yyyy-MM-dd' string, which is what the input[type=date] expects.
    // No conversion or timezone compensation is needed here.
    const lastPaymentDateString = company.lastPaymentDate
      ? company.lastPaymentDate
      : null;

    editForm.reset({
      name: company.name,
      paymentControl: company.paymentControl,
      isActive: company.isActive,
      lastPaymentDate: lastPaymentDateString,
      country: company.country || '',
      province: company.province || '',
      city: company.city || '',
      address: company.address || '',
      taxId: company.taxId || '',
      contactName: company.contactName || '',
      phone: company.phone || '',
      email: company.email || '',
    });
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    createForm.reset(); // Reset create form before opening
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (
      confirm(
        '¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer completamente (se marcará como eliminada).',
      )
    ) {
      deleteCompanyMutation.mutate(id);
    }
  };

  const handleRegisterPayment = (company: MainCompany) => {
    setCompanyToRegisterPaymentFor(company);
    setIsRegisterPaymentModalOpen(true);
  };

  const handleResetAdminPassword = (companyId: number) => {
    resetAdminPasswordMutation.mutate(companyId);
  };

  const handleEditSubmit = (data: EditCompanyFormValues) => {
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, data });
    }
  };

  const handleCreateSubmit = (data: CreateCompanyFormValues) => {
    createCompanyMutation.mutate(data);
  };

  const handleRegisterPaymentSubmit = (paymentDate: Date) => {
    if (companyToRegisterPaymentFor) {
      registerPaymentMutation.mutate({
        id: companyToRegisterPaymentFor.id,
        paymentDate,
      });
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCompany(null);
    editForm.reset();
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const handleCloseRegisterPaymentModal = () => {
    setIsRegisterPaymentModalOpen(false);
    setCompanyToRegisterPaymentFor(null);
  };

  if (isLoading) {
    return (
      <>
        <Header
          title="Gestión de Empresas"
          subtitle="Administra todas las empresas principales"
        />
        <LayoutContent>
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-neutral-500 mt-2">
                Cargando empresas...
              </p>
            </div>
          </div>
        </LayoutContent>
      </>
    );
  }

  return (
    <>
      <Header
        title="Gestión de Empresas"
        subtitle="Administra todas las empresas principales"
      />
      <LayoutContent className="p-4">
        <div className="sticky top-0 z-10 flex flex-col md:flex-row justify-between items-center p-2 bg-background gap-2">
          <div className="w-full md:w-auto">
            <h3 className="text-lg font-semibold text-neutral-900">
              Total <span className="hidden md:inline">Empresas</span> (
              {companiesWithStatus.length})
            </h3>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="w-full md:max-w-xs">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar empresa..."
              />
            </div>
            <Button onClick={handleAdd} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Crear Nueva Empresa
            </Button>
          </div>
        </div>

        <CompanyList
          companies={companiesWithStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRegisterPayment={handleRegisterPayment}
          onResetAdminPassword={handleResetAdminPassword}
          isDeleting={deleteCompanyMutation.isPending}
          isResettingPassword={resetAdminPasswordMutation.isPending}
        />
      </LayoutContent>

      {/* Edit Company Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <FormProvider {...editForm}>
            {editingCompany && (
              <EditCompanyForm
                onSubmit={handleEditSubmit}
                onCancel={handleCloseEditModal}
                isLoading={updateCompanyMutation.isPending}
              />
            )}
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Create Company Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={handleCloseCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Empresa</DialogTitle>
          </DialogHeader>
          <FormProvider {...createForm}>
            <CreateCompanyForm
              onSubmit={handleCreateSubmit}
              onCancel={handleCloseCreateModal}
              isLoading={createCompanyMutation.isPending}
            />
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Register Payment Dialog */}
      <RegisterPaymentDialog
        open={isRegisterPaymentModalOpen}
        onOpenChange={handleCloseRegisterPaymentModal}
        onSubmit={handleRegisterPaymentSubmit}
        isLoading={registerPaymentMutation.isPending}
      />
    </>
  );
}
