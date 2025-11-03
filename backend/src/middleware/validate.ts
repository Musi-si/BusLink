import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

/**
 * A higher-order function that takes a Zod schema and returns an Express middleware.
 * This middleware validates the request's body, query, and params against the schema.
 * If validation fails, it sends a 400 response with the errors.
 * If validation succeeds, it calls next().
 *
 * @param schema The Zod schema to validate against.
 */
export const validate = (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // parseAsync is used to handle async refinements in Zod schemas if any
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // If it's a Zod validation error, send a formatted 400 response
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid input data',
          // flatten() provides a clean, field-by-field error object
          errors: error.flatten().fieldErrors,
        });
      }
      // For any other kind of error, pass it to the global error handler
      return next(error);
    }
  };