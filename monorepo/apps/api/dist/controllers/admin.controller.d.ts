import { Request, Response } from 'express';
export declare class AdminController {
    static getStats(_req: Request, res: Response): Promise<void>;
    static getReports(req: Request, res: Response): Promise<void>;
    static getAILogs(req: Request, res: Response): Promise<void>;
    static debugModels(_req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=admin.controller.d.ts.map