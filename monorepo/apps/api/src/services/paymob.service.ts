import axios from 'axios';

export interface PaymobAuthResponse {
    token: string;
}

export interface PaymobOrderResponse {
    id: number;
}

export interface PaymobPaymentKeyResponse {
    token: string;
}

export class PaymobService {
    private static readonly API_URL = 'https://accept.paymob.com/api';

    static async authenticate(apiKey: string): Promise<string> {
        const response = await axios.post<PaymobAuthResponse>(`${this.API_URL}/auth/tokens`, {
            api_key: apiKey,
        });
        return response.data.token;
    }

    static async registerOrder(authToken: string, amountCents: number, currency: string): Promise<number> {
        const response = await axios.post<PaymobOrderResponse>(`${this.API_URL}/ecommerce/orders`, {
            auth_token: authToken,
            delivery_needed: 'false',
            amount_cents: amountCents,
            currency: currency,
            items: [],
        });
        return response.data.id;
    }

    static async getPaymentKey(
        authToken: string,
        orderId: number,
        amountCents: number,
        currency: string,
        integrationId: string,
        billingData: {
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
        }
    ): Promise<string> {
        const response = await axios.post<PaymobPaymentKeyResponse>(`${this.API_URL}/acceptance/payment_keys`, {
            auth_token: authToken,
            amount_cents: amountCents,
            expiration: 3600,
            order_id: orderId,
            billing_data: billingData,
            currency: currency,
            integration_id: integrationId,
        });
        return response.data.token;
    }

    static async generatePaymentKey(
        apiKey: string,
        integrationId: string,
        amount: number,
        currency: string = 'EGP',
        billingData: any
    ): Promise<string> {
        // Paymob expects amount in cents
        const amountCents = Math.round(amount * 100);

        const authToken = await this.authenticate(apiKey);
        const orderId = await this.registerOrder(authToken, amountCents, currency);
        const paymentKey = await this.getPaymentKey(authToken, orderId, amountCents, currency, integrationId, billingData);

        return paymentKey;
    }
}
