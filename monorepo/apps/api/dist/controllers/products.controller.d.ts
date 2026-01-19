import { Request, Response } from 'express';
export declare class ProductsController {
    static slugify(text: string): string;
    static aiGenerate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static list(req: Request, res: Response): Promise<void>;
    static searchSuggestions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getOne(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static create(req: Request, res: Response): Promise<void>;
    static update(req: Request, res: Response): Promise<void>;
    static bulkUpdate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=products.controller.d.ts.map