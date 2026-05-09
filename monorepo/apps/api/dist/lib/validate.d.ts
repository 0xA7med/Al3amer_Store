import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}
export declare const validate: (schemas: ValidationSchemas) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=validate.d.ts.map