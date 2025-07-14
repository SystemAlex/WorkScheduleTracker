import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { insertMainCompanySchema, insertUserSchema } from '@shared/schema';
import { ComboBox } from '@/components/ui/combobox';
import { Country, State, City } from 'country-state-city';

// Esquema de validación combinado para la empresa y el usuario admin
export const formSchema = z.object({
  companyName: insertMainCompanySchema.shape.name,
  paymentControl: insertMainCompanySchema.shape.paymentControl,
  country: insertMainCompanySchema.shape.country,
  province: insertMainCompanySchema.shape.province,
  city: insertMainCompanySchema.shape.city,
  address: insertMainCompanySchema.shape.address,
  taxId: insertMainCompanySchema.shape.taxId,
  contactName: insertMainCompanySchema.shape.contactName,
  phone: insertMainCompanySchema.shape.phone,
  email: insertMainCompanySchema.shape.email,
  adminUsername: insertUserSchema.shape.username,
});

export type CreateCompanyFormValues = z.infer<typeof formSchema>;

interface CreateCompanyFormProps {
  onSubmit: (data: CreateCompanyFormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CreateCompanyForm({
  onSubmit,
  onCancel,
  isLoading,
}: CreateCompanyFormProps) {
  const form = useFormContext<CreateCompanyFormValues>();

  const allCountries = React.useMemo(() => Country.getAllCountries(), []);
  // Watch for the *name* of the country and province
  const formCountryName = form.watch('country');
  const formProvinceName = form.watch('province');

  const currentCountryObj = React.useMemo(() => {
    // Find by name
    return allCountries.find((c) => c.name === formCountryName) || null;
  }, [formCountryName, allCountries]);

  const currentStateObj = React.useMemo(() => {
    if (!currentCountryObj) return null;
    // Find by name within the states of the current country
    return (
      State.getStatesOfCountry(currentCountryObj.isoCode).find(
        (s) => s.name === formProvinceName,
      ) || null
    );
  }, [formProvinceName, currentCountryObj]);

  const countryOptions = React.useMemo(() => {
    return allCountries.map((country) => ({
      value: country.name, // Store name as value
      label: country.name,
    }));
  }, [allCountries]);

  const stateOptions = React.useMemo(() => {
    if (!currentCountryObj) return [];
    return State.getStatesOfCountry(currentCountryObj.isoCode).map((state) => ({
      value: state.name, // Store name as value
      label: state.name,
    }));
  }, [currentCountryObj]);

  const cityOptions = React.useMemo(() => {
    if (!currentCountryObj || !currentStateObj) return [];
    return City.getCitiesOfState(
      currentCountryObj.isoCode,
      currentStateObj.isoCode,
    ).map((city) => ({
      value: city.name,
      label: city.name,
    }));
  }, [currentCountryObj, currentStateObj]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Datos de la Empresa Principal
        </h3>
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Mi Empresa S.A." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentControl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Control de Pago</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de control de pago" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                  <SelectItem value="permanent">
                    Permanente (Pago Único)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <h3 className="text-lg font-semibold text-neutral-800 mt-6">
          Información de Contacto y Ubicación
        </h3>
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <ComboBox
                key={formCountryName}
                options={countryOptions}
                value={field.value || ''}
                onValueChange={(value) => {
                  form.setValue('country', value);
                  form.setValue('province', '');
                  form.setValue('city', '');
                }}
                placeholder="Selecciona un país..."
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="province"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provincia</FormLabel>
              <ComboBox
                key={formCountryName}
                options={stateOptions}
                value={field.value || ''}
                onValueChange={(value) => {
                  form.setValue('province', value);
                  form.setValue('city', '');
                }}
                placeholder="Selecciona una provincia..."
                disabled={!currentCountryObj}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localidad</FormLabel>
              <ComboBox
                key={formProvinceName}
                options={cityOptions}
                value={field.value || ''}
                onValueChange={(value) => {
                  form.setValue('city', value);
                }}
                placeholder="Selecciona una localidad..."
                disabled={!currentStateObj}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Dirección"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clave Fiscal</FormLabel>
              <FormControl>
                <Input
                  placeholder="Clave Fiscal"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de Contacto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre de Contacto"
                  {...field}
                  value={field.value || ''}
                />
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
              <FormLabel>Celular</FormLabel>
              <FormControl>
                <Input
                  placeholder="Celular"
                  {...field}
                  value={field.value || ''}
                />
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
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h3 className="text-lg font-semibold text-neutral-800 mt-6">
          Datos del Usuario Administrador Inicial
        </h3>
        <FormField
          control={form.control}
          name="adminUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de Usuario del Administrador</FormLabel>
              <FormControl>
                <Input type="text" placeholder="admin_empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creando...' : 'Crear Empresa'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
