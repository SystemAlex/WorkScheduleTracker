import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch'; // Import Switch
import { Label } from '@/components/ui/label'; // Import Label

interface ActiveSession {
  username: string;
  role: string;
  expire: string; // La fecha vendrá como string desde la API
  companyName: string | null; // Add this new property
}

interface ActiveSessionsListProps {
  sessions: ActiveSession[];
  isLoading: boolean;
}

export function ActiveSessionsList({
  sessions,
  isLoading,
}: ActiveSessionsListProps) {
  const now = new Date();
  const [showActiveOnly, setShowActiveOnly] = React.useState(true);
  const [showLatestOnly, setShowLatestOnly] = React.useState(true); // New state for showing only latest session per user

  const processedSessions = React.useMemo(() => {
    let currentSessions = sessions;

    if (showLatestOnly) {
      const sessionsByUser: Map<string, ActiveSession> = new Map(); // Map to store the latest session per user

      // Iterate through all sessions to find the latest one for each user
      sessions.forEach((session) => {
        const existingLatest = sessionsByUser.get(session.username);
        if (
          !existingLatest ||
          new Date(session.expire) > new Date(existingLatest.expire)
        ) {
          sessionsByUser.set(session.username, session);
        }
      });
      currentSessions = Array.from(sessionsByUser.values());
    }

    // Apply active only filter if enabled
    if (showActiveOnly) {
      currentSessions = currentSessions.filter(
        (session) => new Date(session.expire) > now,
      );
    }

    // Final sort (e.g., by username or expiration)
    return [...currentSessions].sort((a, b) => {
      // Sort by active status first (active first)
      const aIsActive = new Date(a.expire) > now;
      const bIsActive = new Date(b.expire) > now;
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      // Then by expiration date (most recent first)
      return new Date(b.expire).getTime() - new Date(a.expire).getTime();
    });
  }, [sessions, showActiveOnly, showLatestOnly, now]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Sesiones ({processedSessions.length})
        </CardTitle>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-latest-only">Última Sesión por Usuario</Label>
            <Switch
              id="show-latest-only"
              checked={showLatestOnly}
              onCheckedChange={setShowLatestOnly}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-active-only">Solo Activas</Label>
            <Switch
              id="show-active-only"
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">Cargando sesiones...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">
              No hay sesiones para mostrar.
            </p>
          </div>
        ) : (
          <div className="max-h-[250px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Expira</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedSessions.map((session, index) => {
                  const isExpired = new Date(session.expire) < now;
                  return (
                    <TableRow
                      key={`${session.username}-${session.expire}-${index}`}
                      className={isExpired ? 'opacity-50' : ''}
                    >
                      <TableCell className="font-medium">
                        {session.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {session.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{session.companyName || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={isExpired ? 'destructive' : 'success'}>
                          {isExpired ? 'Expirada' : 'Activa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        <div className="flex items-center justify-end">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(session.expire), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
