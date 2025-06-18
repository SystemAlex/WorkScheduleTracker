import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Header } from "@/components/layout/header";
import { LayoutContent } from "@/components/ui/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShiftTypeSchema } from "@shared/schema";
import type { ShiftType, InsertShiftType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getShiftColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Shifts() {
  const [modalOpen, setModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: shiftTypes = [], isLoading } = useQuery<ShiftType[]>({
    queryKey: ["/api/shift-types"],
  });

  const createShiftTypeMutation = useMutation({
    mutationFn: async (data: InsertShiftType) => {
      const response = await apiRequest("POST", "/api/shift-types", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-types"] });
      setModalOpen(false);
      toast({
        title: "Tipo de turno creado",
        description: "El tipo de turno ha sido creado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el tipo de turno.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertShiftType>({
    resolver: zodResolver(insertShiftTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      startTime: "",
      endTime: "",
      color: "#3B82F6",
    },
  });

  const handleSubmit = (data: InsertShiftType) => {
    createShiftTypeMutation.mutate(data);
  };

  const handleAdd = () => {
    form.reset({
      name: "",
      code: "",
      startTime: "",
      endTime: "",
      color: "#3B82F6",
    });
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">Cargando tipos de turno...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Tipos de Turno"
        subtitle="Configura los diferentes tipos de turnos de trabajo"
      />

      <LayoutContent>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Tipos de Turno ({shiftTypes.length})
            </h3>
            <p className="text-sm text-neutral-500">
              Define los horarios y características de cada turno
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Tipo de Turno
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shiftTypes.map((shiftType) => {
            const color = getShiftColor(shiftType.code);
            return (
              <Card key={shiftType.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        color === 'blue' && "bg-blue-100",
                        color === 'green' && "bg-green-100",
                        color === 'orange' && "bg-orange-100",
                        color === 'purple' && "bg-purple-100"
                      )}>
                        <Clock className={cn(
                          "w-5 h-5",
                          color === 'blue' && "text-blue-600",
                          color === 'green' && "text-green-600",
                          color === 'orange' && "text-orange-600",
                          color === 'purple' && "text-purple-600"
                        )} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{shiftType.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            color === 'blue' && "bg-blue-100 text-blue-800",
                            color === 'green' && "bg-green-100 text-green-800",
                            color === 'orange' && "bg-orange-100 text-orange-800",
                            color === 'purple' && "bg-purple-100 text-purple-800"
                          )}>
                            {shiftType.code}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Horario:</span>
                      <span className="text-sm font-medium">
                        {shiftType.startTime} - {shiftType.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Color:</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: shiftType.color }}
                        />
                        <span className="text-xs text-neutral-500">{shiftType.color}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {shiftTypes.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No hay tipos de turno configurados
            </h3>
            <p className="text-neutral-500 mb-4">
              Comienza creando los tipos de turno para tu organización
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Tipo de Turno
            </Button>
          </div>
        )}
      </LayoutContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Tipo de Turno</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del turno</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Turno Mañana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: M, T, N, E" 
                        maxLength={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora fin</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-3">
                        <Input type="color" className="w-16 h-10 p-1" {...field} />
                        <Input 
                          type="text" 
                          placeholder="#3B82F6"
                          className="flex-1"
                          {...field}
                        />
                      </div>
                    </FormControl>
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
                <Button type="submit" disabled={createShiftTypeMutation.isPending}>
                  {createShiftTypeMutation.isPending ? "Creando..." : "Crear Tipo"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
