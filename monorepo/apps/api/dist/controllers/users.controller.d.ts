import { Request, Response } from 'express';
export declare class UsersController {
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/users
     * Returns a UNIFIED list of customers: registered users + guest order groups.
     * Groups all orders by phone_number. If a registered user exists with that phone,
     * they are used as the record; otherwise a guest record is synthesised.
     */
    static list(req: Request, res: Response): Promise<void>;
    static getOne(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static deleteCustomer(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateCustomer(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=users.controller.d.ts.map