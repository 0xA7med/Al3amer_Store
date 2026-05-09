import { Request, Response } from 'express';
export declare class SettingsController {
    static get(_req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getPublic(_req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static update(req: Request, res: Response): Promise<void>;
    static testGemini(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static testNotification(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=settings.controller.d.ts.map