import { Request, Response } from 'express';
export declare class ProductsController {
    static slugify(text: string): string;
    static aiGenerate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static cache: Map<string, {
        data: any;
        timestamp: number;
    }>;
    static CACHE_TTL: number;
    static clearCache(): void;
    static list(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static searchSuggestions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static popularSearches(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getOne(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateShortName(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static bulkUpdate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static bulkAction(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static validateCart(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, res: Response): Promise<void>;
    static suggestRelatedProducts(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=products.controller.d.ts.map