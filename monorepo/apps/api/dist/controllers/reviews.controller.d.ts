import { Request, Response } from 'express';
export declare class ReviewsController {
    static list(req: Request, res: Response): Promise<void>;
    static getOne(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static approve(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=reviews.controller.d.ts.map