import { Request, Response } from 'express';
export declare class CategoriesController {
    list(req: Request, res: Response): Promise<void>;
    get(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=categories.controller.d.ts.map