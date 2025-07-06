import { Router } from 'express';
import { storage } from '../storage';
import { insertClienteSchema } from '@shared/schema';
import { validate } from '../middleware/validate'; // Import the new middleware

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
clientsRouter.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const clientes = await storage.getClientes(search as string);
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch clientes' });
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
clientsRouter.post('/', validate(insertClienteSchema), async (req, res) => {
  try {
    // req.body is already validated by the middleware
    const cliente = await storage.createCliente(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create cliente' });
  }
});

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
 *       500:
 *         description: Error interno
 */
clientsRouter.put('/:id', validate(insertClienteSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // req.body is already validated by the middleware
    const cliente = await storage.updateCliente(id, req.body);
    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update cliente' });
  }
});

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
 *       500:
 *         description: Error interno
 */
clientsRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteCliente(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete cliente' });
  }
});

export default clientsRouter;
