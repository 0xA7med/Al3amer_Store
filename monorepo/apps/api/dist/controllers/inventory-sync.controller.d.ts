import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare class InventorySyncController {
    /**
     * POST /api/products/import/preview
     * Parse Excel and compare with database, return diff report
     */
    static preview(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /api/products/import/execute
     * Execute approved changes from preview
     */
    static execute(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=inventory-sync.controller.d.ts.map