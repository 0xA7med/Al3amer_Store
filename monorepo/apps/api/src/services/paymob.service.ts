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

    static async registerOrder(authToken: string, amountCents: number, currency: string, merchantOrderId: string): Promise<number> {
        const response = await axios.post<PaymobOrderResponse>(`${this.API_URL}/ecommerce/orders`, {
            auth_token: authToken,
            delivery_needed: 'false',
            amount_cents: amountCents,
            currency: currency,
            merchant_order_id: merchantOrderId, // Link to our order number
            items: [],
        });
        console.log(`📦 Paymob Order Created: ID=${response.data.id}, Merchant Order=${merchantOrderId}`);
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
        merchantOrderId: string,
        currency: string = 'EGP',
        billingData: any
    ): Promise<{ token: string; orderId: string }> {
        try {
            // Paymob expects amount in cents
            const amountCents = Math.round(amount * 100);

            console.log(`[Paymob] Authenticating with Paymob API...`);
            const authToken = await this.authenticate(apiKey);
            
            console.log(`[Paymob] Registering Order for Merchant ID: ${merchantOrderId}...`);
            const orderId = await this.registerOrder(authToken, amountCents, currency, merchantOrderId);
            
            console.log(`[Paymob] Getting Payment Key for Integration ID: ${integrationId}...`);
            const paymentKey = await this.getPaymentKey(authToken, orderId, amountCents, currency, integrationId, billingData);

            return { token: paymentKey, orderId: orderId.toString() };
        } catch (error: any) {
            console.error('❌ [PaymobService] generatePaymentKey Error:', error?.response?.data || error?.message);
            
            // Check for specific error status codes
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                throw new Error('خطأ في مصادقة بوابة الدفع: يرجى التأكد من أن مفاتيح API صحيحة وأن الـ IP مضاف للقائمة البيضاء في Paymob.');
            } else if (error?.response?.status === 404) {
                throw new Error('خطأ في بوابة الدفع: Integration ID أو Iframe ID غير صحيح.');
            }
            
            throw new Error(`فشل في الاتصال ببوابة الدفع: ${error?.response?.data?.detail || error?.message || 'خطأ غير معروف'}`);
        }
    }

    static async payWithWallet(paymentKey: string, phoneNumber: string): Promise<string> {
        console.log(`🔌 payWithWallet called with Phone: ${phoneNumber}, Key Length: ${paymentKey?.length}`);
        try {
            const payload = {
                source: {
                    identifier: phoneNumber,
                    subtype: "WALLET"
                },
                payment_token: paymentKey
            };

            console.log('🚀 Paymob Wallet Payload:', JSON.stringify({
                source: { identifier: phoneNumber, subtype: "WALLET" },
                payment_token: paymentKey.substring(0, 20) + '...'
            }, null, 2));

            const response = await axios.post(`${this.API_URL}/acceptance/payments/pay`, payload);

            console.log('✅ Paymob Wallet Response:', response.data);
            // Wallets typically return a redirect_url or iframe_redirection_url
            // checking both just in case, prioritize redirect_url
            return response.data.redirect_url || response.data.iframe_redirection_url;
        } catch (error: any) {
            console.error('Paymob Wallet Pay Error:', error.response?.data || error.message);
            throw new Error('Failed to initiate wallet payment');
        }
    }

    static async getOrderIdByMerchantOrderId(apiKey: string, merchantOrderId: string): Promise<string | null> {
        try {
            const authToken = await this.authenticate(apiKey);
            if (!authToken) {
                throw new Error('Failed to authenticate with Paymob');
            }
            console.log(`🔍 Looking up Paymob Order for Merchant ID: ${merchantOrderId}`);

            // Search for Paymob order by our Merchant Order ID
            // We pass auth_token in query params AND as Bearer token to be safe
            const response = await axios.get(`${this.API_URL}/ecommerce/orders`, {
                params: {
                    auth_token: authToken, // Legacy/V1
                    merchant_order_id: merchantOrderId
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}` // Attempt V2 style or just extra safety
                }
            });

            // Response.data.results should contain the array of orders
            const orders = response.data.results || [];
            if (orders.length > 0) {
                const foundId = orders[0].id.toString();
                console.log(`✅ Found Paymob Order ID: ${foundId}`);
                return foundId;
            }
            console.log(`⚠️ No Paymob order found for Merchant ID: ${merchantOrderId}`);
            return null;
        } catch (error: any) {
            console.error('Paymob Get Order By Merchant ID Error:', error.response?.data || error.message);
            // If 401/403, it means token issue. 
            throw new Error('Failed to fetch order ID from Paymob');
        }
    }

    static async getTransactionStatus(apiKey: string, paymobOrderId: string): Promise<boolean> {
        try {
            const authToken = await this.authenticate(apiKey);
            if (!authToken) {
                throw new Error('Failed to authenticate with Paymob');
            }

            console.log(`🔍 Checking Paymob Transactions for Order ${paymobOrderId}...`);

            // Get transactions for this order
            const response = await axios.get(`${this.API_URL}/acceptance/transactions`, {
                params: {
                    auth_token: authToken,
                    order_id: paymobOrderId
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}` // Add for V2 API compatibility
                }
            });

            // Check if any transaction is successful
            const transactions = response.data.results || [];
            const isPaid = transactions.some((t: any) => t.success === true);

            console.log(`✅ Found ${transactions.length} transaction(s), Payment Status: ${isPaid ? 'PAID' : 'PENDING'}`);
            return isPaid;
        } catch (error: any) {
            console.error('Paymob Transaction Status Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch transaction status');
        }
    }
}
