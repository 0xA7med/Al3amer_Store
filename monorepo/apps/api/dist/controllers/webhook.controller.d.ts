import { Request, Response } from 'express';
export declare class WebhookController {
    /**
     * POST /api/webhook/paymob
     * Handles Paymob transaction webhooks with HMAC security
     */
    static handlePaymobWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=webhook.controller.d.ts.map