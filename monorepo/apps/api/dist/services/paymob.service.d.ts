export interface PaymobAuthResponse {
    token: string;
}
export interface PaymobOrderResponse {
    id: number;
}
export interface PaymobPaymentKeyResponse {
    token: string;
}
export declare class PaymobService {
    private static readonly API_URL;
    static authenticate(apiKey: string): Promise<string>;
    static registerOrder(authToken: string, amountCents: number, currency: string, merchantOrderId: string): Promise<number>;
    static getPaymentKey(authToken: string, orderId: number, amountCents: number, currency: string, integrationId: string, billingData: {
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        apartment: string;
        floor: string;
        street: string;
        building: string;
        shipping_method: string;
        postal_code: string;
        city: string;
        country: string;
        state: string;
    }): Promise<string>;
    static generatePaymentKey(apiKey: string, integrationId: string, amount: number, merchantOrderId: string, currency: string | undefined, billingData: any): Promise<{
        token: string;
        orderId: string;
    }>;
    static payWithWallet(paymentKey: string, phoneNumber: string): Promise<string>;
    static getOrderIdByMerchantOrderId(apiKey: string, merchantOrderId: string): Promise<string | null>;
    static getTransactionStatus(apiKey: string, paymobOrderId: string): Promise<boolean>;
}
//# sourceMappingURL=paymob.service.d.ts.map