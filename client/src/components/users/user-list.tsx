import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, KeyRound } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm';
import type { User } from '@shared/schema';
import { useAuth } from '@/context/auth-context';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

interface UserListProps {
  users: UserWithoutPassword[];
  currentUser: ReturnType<typeof useAuth>['user'];
  onEdit: (user: UserWithoutPassword) => void;
  onDelete: (id: number) => void;
  onResetPassword: (id: number) => void;
  isDeleting: boolean;
  isResettingPassword: boolean;
}

export function UserList({
  users,
  currentUser,
  onEdit,
  onDelete,
  onResetPassword,
  isDeleting,
  isResettingPassword,
}: UserListProps) {
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'supervisor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre de Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>
                <Badge
                  variant={getRoleVariant(user.role)}
                  className="capitalize"
                >
                  {user.role.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right flex justify-end space-x-2">
                {currentUser?.id !== user.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isResettingPassword}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      }
                      title="¿Restablecer contraseña?"
                      description="Esto establecerá la contraseña del usuario a 'password123'. ¿Querés continuar?"
                      onConfirm={() => onResetPassword(user.id)}
                      isLoading={isResettingPassword}
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm" disabled={isDeleting}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      title="¿Eliminar usuario?"
                      description="Esta acción no se puede deshacer. ¿Querés continuar?"
                      onConfirm={() => onDelete(user.id)}
                      isLoading={isDeleting}
                    />
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
