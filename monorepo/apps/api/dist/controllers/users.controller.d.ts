import { Request, Response } from 'express';
export declare class UsersController {
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static list(req: Request, res: Response): Promise<void>;
    static getOne(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=users.controller.d.ts.map