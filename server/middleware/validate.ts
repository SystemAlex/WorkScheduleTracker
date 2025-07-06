import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate req.body against the provided Zod schema
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // If it's a Zod validation error, send a 400 response with details
        return res.status(400).json({
          message: 'Invalid data',
          errors: error.errors,
        });
      }
      // For any other error, pass it to the next error handling middleware
      next(error);
    }
  };
