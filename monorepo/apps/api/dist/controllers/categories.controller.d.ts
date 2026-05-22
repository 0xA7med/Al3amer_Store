import { Request, Response } from 'express';
export declare class CategoriesController {
    static cache: Map<string, {
        data: any;
        timestamp: number;
    }>;
    static CACHE_TTL: number;
    static clearCache(): void;
    list(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    get(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=categories.controller.d.ts.map