import { Router } from 'express';
import { storage } from '../storage';
import { insertClienteSchema } from '@shared/schema';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../errors'; // Import NotFoundError

const clientsRouter = Router();

/**
 * @openapi
 * /api/clientes:
 *   get:
 *     summary: Obtiene todos los clientes
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar clientes por nombre de empresa.
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
clientsRouter.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const clientes = await storage.getClientes(search as string);
    res.json(clientes);
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

/**
 * @openapi
 * /api/clientes:
 *   post:
 *     summary: Crea un nuevo cliente
 *     tags: [Clientes]
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
 */
clientsRouter.post(
  '/',
  validate(insertClienteSchema),
  async (req, res, next) => {
    try {
      const cliente = await storage.createCliente(req.body);
      res.status(201).json(cliente);
    } catch (error) {
      next(error); // Pass error to global error handler
    }
  },
);

/**
 * @openapi
 * /api/clientes/{id}:
 *   put:
 *     summary: Actualiza un cliente existente
 *     tags: [Clientes]
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
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno
 */
clientsRouter.put(
  '/:id',
  validate(insertClienteSchema),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await storage.updateCliente(id, req.body);
      if (!cliente) {
        throw new NotFoundError('Cliente not found');
      }
      res.json(cliente);
    } catch (error) {
      next(error); // Pass error to global error handler
    }
  },
);

/**
 * @openapi
 * /api/clientes/{id}:
 *   delete:
 *     summary: Elimina un cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Cliente eliminado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno
 */
clientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteCliente(id);
    if (!deleted) {
      throw new NotFoundError('Cliente not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

export default clientsRouter;
