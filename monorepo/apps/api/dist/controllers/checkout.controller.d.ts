import { Request, Response } from 'express';
/**
 * Checkout Controller
 * Handles payment initiation and verification WITHOUT creating orders.
 * Orders are only created in the orders controller AFTER payment is confirmed.
 */
export declare class CheckoutController {
    /**
     * POST /api/checkout/initiate-payment
     * Creates a Paymob payment session. Does NOT create an order.
     * Returns a payment URL for the frontend to open in an iframe/redirect.
     */
    static initiatePayment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /api/checkout/verify
     * Checks if a Paymob payment was successful by paymobOrderId.
     * Does NOT create an order — just returns payment status.
     */
    static verifyPayment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=checkout.controller.d.ts.map