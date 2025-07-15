import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, History } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { getRelativeDayLabel } from '@/lib/utils'; // Importar la función

type Period = 'day' | 'week' | 'month' | 'year' | 'custom';

let now = new Date().toISOString();

export function LoginHistoryChart() {
  const [period, setPeriod] = React.useState<Period>('day'); // Cambiado a 'day' como valor inicial
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  let totalLogins = 0;

  const queryParams = new URLSearchParams();
  if (period === 'custom' && dateRange?.from && dateRange?.to) {
    queryParams.append('period', 'custom');
    queryParams.append('startDate', dateRange.from.toISOString());
    queryParams.append('endDate', dateRange.to.toISOString());
  } else if (period !== 'custom') {
    queryParams.append('period', period);
    queryParams.append('startDate', now);
  }

  const { data: historyData = [], isLoading } = useQuery({
    queryKey: ['/api/sentinelzone/login-history', queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/sentinelzone/login-history?${queryParams.toString()}`,
      );
      return res.json();
    },
    enabled: period !== 'custom' || !!(dateRange?.from && dateRange?.to),
  });

  const handlePeriodChange = (newPeriod: Period) => {
    now = new Date().toISOString();
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setDateRange(undefined);
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setPeriod('custom');
    }
  };

  const formatXAxis = (tickItem: string) => {
    const date = parseISO(tickItem);
    if (period === 'day') {
      return getRelativeDayLabel(date); // Usar la función para 'Hoy'
    }
    if (period === 'year') {
      return format(date, 'MMM', { locale: es });
    }
    return format(date, 'dd MMM', { locale: es });
  };

  if (historyData.length > 0) {
    totalLogins = historyData.reduce(
      (acc: any, item: any) => acc + item.logins,
      0,
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="mr-2 h-5 w-5" />
          Actividad de Inicio de Sesión
        </CardTitle>
        <CardDescription>
          Número de inicios de sesión en el período seleccionado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <Button
            variant={period === 'day' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('day')}
          >
            Hoy
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('week')}
          >
            Semana
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('month')}
          >
            Mes
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('year')}
          >
            Año
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={period === 'custom' ? 'default' : 'outline'}
                className={cn(
                  'w-[300px] justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Seleccionar rango</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              Cargando datos...
            </div>
          ) : historyData.length === 0 || totalLogins === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No hay inicios de sesión en este período.
            </div>
          ) : (
            <div
              className={cn(
                'h-full w-full',
                historyData.length === 1 && 'w-full lg:w-1/2',
                'ml-[-15vw] md:ml-[-6vw] xl:ml-[-4vw] 2xl:ml-[-2vw]',
              )}
            >
              <ResponsiveContainer width="100%" height="100%">
                {historyData.length === 1 ? (
                  <BarChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatXAxis} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => {
                        const date = parseISO(label);
                        return format(date, 'PPP', { locale: es }); // Mostrar solo la fecha
                      }}
                      formatter={(value) => [
                        `${value} logins`,
                        'Inicios de Sesión',
                      ]}
                    />
                    <Legend />
                    <Bar
                      type="monotone"
                      dataKey="logins"
                      name="Inicios de Sesión"
                      fill="#8884d8"
                    />
                  </BarChart>
                ) : (
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatXAxis} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => {
                        const date = parseISO(label);
                        return format(date, 'PPP', { locale: es }); // Mostrar solo la fecha
                      }}
                      formatter={(value) => [
                        `${value} logins`,
                        'Inicios de Sesión',
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="logins"
                      name="Inicios de Sesión"
                      stroke="#8884d8"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
