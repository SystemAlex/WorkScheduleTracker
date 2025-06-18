import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit3, Trash2, User, Mail, Phone, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { LayoutContent } from "@/components/ui/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema } from "@shared/schema";
import type { Employee, InsertEmployee } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertEmployeeSchema;

export default function Employees() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee>();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setModalOpen(false);
      setEditingEmployee(undefined);
      toast({
        title: "Empleado creado",
        description: "El empleado ha sido creado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el empleado.",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertEmployee }) => {
      const response = await apiRequest("PUT", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setModalOpen(false);
      setEditingEmployee(undefined);
      toast({
        title: "Empleado actualizado",
        description: "El empleado ha sido actualizado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el empleado.",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Empleado eliminado",
        description: "El empleado ha sido eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleado.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      position: "",
      status: "active",
    },
  });

  const handleSubmit = (data: InsertEmployee) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      position: employee.position || "",
      status: employee.status,
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(undefined);
    form.reset({
      name: "",
      email: "",
      phone: "",
      position: "",
      status: "active",
    });
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este empleado?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Gestión de Empleados"
        subtitle="Administra la información de tu equipo de trabajo"
      />

      <LayoutContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Empleados ({employees.length})
            </h3>
            <p className="text-sm text-neutral-500">
              Gestiona los empleados de tu organización
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Empleado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <Card key={employee.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-300 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {employee.email && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Mail className="w-4 h-4" />
                      <span>{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Phone className="w-4 h-4" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.position && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{employee.position}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No hay empleados registrados
            </h3>
            <p className="text-neutral-500 mb-4">
              Comienza agregando empleados a tu organización
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Empleado
            </Button>
          </div>
        )}
      </LayoutContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Editar Empleado" : "Agregar Empleado"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa el nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puesto</FormLabel>
                    <FormControl>
                      <Input placeholder="Puesto de trabajo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                >
                  {editingEmployee ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
