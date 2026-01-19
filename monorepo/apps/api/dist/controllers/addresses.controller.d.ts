import { Request, Response } from 'express';
export declare class AddressesController {
    static list(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static setDefault(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=addresses.controller.d.ts.map