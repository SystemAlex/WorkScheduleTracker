import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CompanyWithCalculatedStatus } from '@/lib/superadmin-utils';

interface CompanyPaymentPlanChartProps {
  companies: CompanyWithCalculatedStatus[];
}

const COLORS = {
  Permanente: '#6366F1', // indigo-500
  Mensual: '#3B82F6', // blue-500
  Anual: '#10B981', // emerald-500
};

const RADIAN = Math.PI / 180;

interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomizedLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent * 100 < 5) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-bold text-sm drop-shadow-md"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CompanyPaymentPlanChart({
  companies,
}: CompanyPaymentPlanChartProps) {
  const chartData = React.useMemo(() => {
    const counts = {
      Permanente: 0,
      Mensual: 0,
      Anual: 0,
    };

    companies.forEach((company) => {
      switch (company.paymentControl) {
        case 'permanent':
          counts.Permanente++;
          break;
        case 'monthly':
          counts.Mensual++;
          break;
        case 'annual':
          counts.Anual++;
          break;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((entry) => entry.value > 0);
  }, [companies]);

  if (companies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Plan de Pago</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">
            No hay datos de empresas para mostrar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por Plan de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} ${value === 1 ? 'empresa' : 'empresas'}`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
