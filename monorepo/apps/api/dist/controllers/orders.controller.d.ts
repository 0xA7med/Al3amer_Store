import { Request, Response } from 'express';
export declare class OrdersController {
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static list(req: Request, res: Response): Promise<void>;
    static getOne(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static verifyPayment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=orders.controller.d.ts.map