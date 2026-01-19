import { Request, Response } from 'express';
export declare class WishlistController {
    static list(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static add(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static remove(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static toggle(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static check(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=wishlist.controller.d.ts.map