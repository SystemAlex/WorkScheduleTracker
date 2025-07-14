import { Router, Request } from 'express';
import { storage } from '../storage';
import { insertClienteSchema } from '@shared/schema';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../errors';
import {
  isAuthenticated,
  authorizeCompany,
  authorizeRole,
  checkCompanyPaymentStatus,
} from '../middleware/auth'; // Importar middlewares

const clientsRouter = Router();

// Aplicar isAuthenticated y authorizeCompany a todas las rutas de clientes
clientsRouter.use(isAuthenticated, authorizeCompany, checkCompanyPaymentStatus);

/**
 * @openapi
 * /api/clientes:
 *   get:
 *     summary: Obtiene todos los clientes
 *     tags: [Clientes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar clientes por nombre de empresa.
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
clientsRouter.get('/', async (req: Request, res, next) => {
  // Use Request here
  try {
    const { search } = req.query;
    // Pasar mainCompanyId a la función de almacenamiento
    const clientes = await storage.getClientes(
      search as string,
      req.mainCompanyId ?? undefined,
    );
    res.json(clientes);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/clientes:
 *   post:
 *     summary: Crea un nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Cliente creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
clientsRouter.post(
  '/',
  authorizeRole(['admin']), // Solo administradores pueden crear clientes
  validate(insertClienteSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      // Pasar mainCompanyId a la función de almacenamiento
      const cliente = await storage.createCliente(req.body, req.mainCompanyId!);
      res.status(201).json(cliente);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/clientes/{id}:
 *   put:
 *     summary: Actualiza un cliente existente
 *     tags: [Clientes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno
 */
clientsRouter.put(
  '/:id',
  authorizeRole(['admin']), // Solo administradores pueden actualizar clientes
  validate(insertClienteSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const id = parseInt(req.params.id);
      // Pasar mainCompanyId a la función de almacenamiento
      const cliente = await storage.updateCliente(
        id,
        req.body,
        req.mainCompanyId ?? undefined,
      );
      if (!cliente) {
        throw new NotFoundError('Cliente not found');
      }
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/clientes/{id}:
 *   delete:
 *     summary: Elimina un cliente
 *     tags: [Clientes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Cliente eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno
 */
clientsRouter.delete(
  '/:id',
  authorizeRole(['admin']),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const id = parseInt(req.params.id);
      // Pasar mainCompanyId a la función de almacenamiento
      const deleted = await storage.deleteCliente(
        id,
        req.mainCompanyId ?? undefined,
      );
      if (!deleted) {
        throw new NotFoundError('Cliente not found');
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default clientsRouter;
