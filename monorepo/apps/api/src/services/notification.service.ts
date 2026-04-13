import axios from 'axios';
import nodemailer from 'nodemailer';
import { db } from '../db/index.js';
import { decryptText } from '../lib/crypto.utils.js';

export class NotificationService {
    /**
     * Sends a notification for a new order to all enabled channels
     */
    static async sendNewOrderNotification(order: any) {
        try {
            console.log(`📤 [NotificationService] Starting notification dispatch for Order #${order?.orderNumber}...`);
            console.log(`📤 [NotificationService] Order paymentMethod: ${order?.paymentMethod}, items: ${order?.items?.length || 0}`);

            const appSettings = await db.query.settings.findFirst();
            if (!appSettings) {
                console.error('❌ [NotificationService] No settings found in DB — aborting notifications.');
                return;
            }

            const message = this.formatOrderMessage(order);
            console.log(`📤 [NotificationService] Message length: ${message.length} chars`);

            // 1. Telegram
            if (appSettings.telegramEnabled && appSettings.telegramBotToken && appSettings.telegramChatId) {
                const token = decryptText(appSettings.telegramBotToken) ?? appSettings.telegramBotToken;
                await this.sendTelegram(token, appSettings.telegramChatId, message);
            }

            // 2. WhatsApp (CallMeBot)
            if (appSettings.whatsappEnabled && appSettings.whatsappApiKey && appSettings.whatsappRecipientPhone) {
                console.log(`📤 [WA] WhatsApp enabled. Recipient (raw): ${appSettings.whatsappRecipientPhone}`);
                const apiKey = decryptText(appSettings.whatsappApiKey) ?? appSettings.whatsappApiKey;
                console.log(`📤 [WA] API key decrypted OK: ${apiKey ? 'yes (' + apiKey.length + ' chars)' : 'EMPTY/NULL'}`);
                await this.sendWhatsAppCallMeBot(apiKey!, appSettings.whatsappRecipientPhone, message);
            } else {
                console.log(`⚠️ [WA] WhatsApp skipped — enabled: ${appSettings.whatsappEnabled}, apiKey: ${!!appSettings.whatsappApiKey}, phone: ${!!appSettings.whatsappRecipientPhone}`);
            }

            // 3. Email
            if (appSettings.emailEnabled && appSettings.smtpHost && appSettings.smtpPass) {
                const pass = decryptText(appSettings.smtpPass) ?? appSettings.smtpPass;
                await this.sendEmail(appSettings, pass, order);
            }

            console.log(`✅ [NotificationService] All notification channels processed for Order #${order?.orderNumber}.`);
        } catch (error) {
            console.error('❌ [NotificationService] CRITICAL — Failed to send notifications:', error);
        }
    }

    private static formatOrderMessage(order: any): string {
        const itemsList = order.items?.map((item: any) => {
            const price = parseFloat(item.price || '0');
            const qty = item.quantity || 1;
            return `• ${item.name} (x${qty}) — ${(price * qty).toLocaleString('en')} ج.م`;
        }).join('\n') || 'لا توجد منتجات';

        let paymentInfo = `💳 *طريقة الدفع:* `;
        const shipping = parseFloat(order.shippingCost || '0');
        
        if (order.paymentMethod === 'cod') {
            if (order.codAdvancePayment && parseFloat(order.codAdvancePayment) > 0) {
                const advance = parseFloat(order.codAdvancePayment);
                const atDelivery = order.totalAtDelivery ? parseFloat(order.totalAtDelivery) : (parseFloat(order.total) - advance);
                paymentInfo += `عربون (دفع جزئي)\n💰 *المدفوع مقدماً:* ${advance} ج.م\n💵 *المطلوب عند الاستلام:* ${atDelivery} ج.م`;
            } else {
                paymentInfo += `دفع عند الاستلام\n💵 *المطلوب عند الاستلام:* ${order.totalAtDelivery || order.total} ج.م`;
            }
        } else if (order.paymentMethod === 'manual_paid') {
            paymentInfo += `مدفوع بالكامل مقدماً\n💵 *المطلوب عند الاستلام:* ${shipping} ج.م (مصاريف الشحن)`;
        } else if (order.paymentMethod === 'paymob_wallet') {
            paymentInfo += `محفظة إلكترونية`;
        } else if (order.paymentMethod === 'paymob') {
            paymentInfo += `بطاقة ائتمان (فيزا)`;
        } else {
            paymentInfo += `دفع إلكتروني`;
        }

        const locationInfo = order.city && order.city !== 'لا يوجد' ? `${order.governorate} - ${order.city}` : `${order.governorate}`;
        
        const lines = [
            `📦 *طلب جديد رقم ${order.orderNumber}*`,
            '',
            `👤 *العميل:* ${order.fullName}`,
            `📞 *الهاتف:* ${order.phone}`,
            order.phone2 ? `📞 *هاتف إضافي:* ${order.phone2}` : '',
            `📍 *العنوان:* ${locationInfo}`,
            `🏠 *التفاصيل:* ${order.address}`,
            order.notes ? `📝 *الملاحظات:* ${order.notes}` : '',
            '',
            order.trader ? `🏪 *التاجر:* ${order.trader.name || order.trader.traderBranding?.storeName || 'تاجر مسجل'}\n` : '',
            `🛒 *المنتجات:*`,
            itemsList,
            '',
            `💰 *إجمالي قيمة الطلب:* ${order.total} ج.م`,
            paymentInfo,
            '',
            '---',
            'نتمنى لك يوماً سعيداً! 🚀'
        ];

        return lines.filter(line => line !== null && line !== undefined && line !== '').join('\n');
    }

    private static async sendTelegram(token: string, chatId: string, message: string) {
        try {
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            await axios.post(url, {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            });
            console.log('✅ [Notification] Telegram message sent');
        } catch (error: any) {
            console.error('❌ [Notification] Telegram Error:', error.response?.data || error.message);
        }
    }

    private static async sendWhatsAppCallMeBot(apiKey: string, phone: string, message: string) {
        try {
            // 1. Format the recipient phone correctly (CallMeBot needs country code, no '+')
            const cleanPhone = this.formatWhatsAppPhone(phone);
            
            // 2. Optimized message for WhatsApp URL limits
            // CallMeBot sometimes fails with very long URLs or specific symbols
            let cleanMessage = message.replace(/\*/g, '').replace(/#/g, 'No.');
            
            // If message is too long (> 1500 chars), we truncate the items list part to save space
            if (cleanMessage.length > 1500) {
                console.warn(`⚠️ [WA] Message too long (${cleanMessage.length} chars), truncating for URL safety...`);
                cleanMessage = cleanMessage.substring(0, 1500) + '\n\n... (تكملة الطلب في سجلات الإدارة)';
            }

            const encodedText = encodeURIComponent(cleanMessage);
            const encodedPhone = encodeURIComponent(cleanPhone);
            const url = `https://api.callmebot.com/whatsapp.php?phone=${encodedPhone}&text=${encodedText}&apikey=${apiKey}`;

            console.log(`📤 [WA] Sending to phone: ${cleanPhone} (original: ${phone})`);
            console.log(`📤 [WA] URL length: ${url.length} chars`);

            // Use a longer timeout (30s) as CallMeBot can be slow
            const resp = await axios.get(url, { timeout: 30000 });
            console.log(`✅ [WA] WhatsApp (CallMeBot) sent. Response status: ${resp.status}`);
        } catch (error: any) {
            console.error('❌ [WA] WhatsApp FULL Error Object:', JSON.stringify({
                message: error.message,
                status: error.response?.status,
                data: error.response?.data ? String(error.response.data).substring(0, 500) : 'N/A',
            }, null, 2));
        }
    }

    private static formatWhatsAppPhone(phone: string): string {
        let cleaned = phone.replace(/\D/g, ''); // Keep only digits
        
        // If it starts with '01' (Egyptian local format), add '2' for country code
        if (cleaned.startsWith('01') && cleaned.length === 11) {
            cleaned = '2' + cleaned;
        }
        
        // Ensure no lead zeros for international format
        if (cleaned.startsWith('00')) {
            cleaned = cleaned.substring(2);
        }
        
        return cleaned;
    }

    private static async sendEmail(settings: any, pass: string, order: any) {
        try {
            const transporter = nodemailer.createTransport({
                host: settings.smtpHost,
                port: settings.smtpPort || 587,
                secure: settings.smtpPort === 465,
                auth: {
                    user: settings.smtpUser,
                    pass: pass,
                },
            });

            const paymentLabel = order.paymentMethod === 'cod' 
                ? 'دفع عند الاستلام' 
                : order.paymentMethod === 'manual_paid' 
                ? 'مدفوع بالكامل' 
                : 'دفع إلكتروني';

            const itemsHtml = order.items?.map((item: any) => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.price} ج.م</td>
                </tr>
            `).join('') || '';

            const mailOptions = {
                from: settings.emailFrom || settings.smtpUser,
                to: settings.emailReceiver,
                subject: `طلب جديد من متجرك #${order.orderNumber}`,
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #2563eb; text-align: center;">طلب جديد #${order.orderNumber}</h2>
                        <hr>
                        <p><strong>العميل:</strong> ${order.fullName}</p>
                        <p><strong>الهاتف:</strong> ${order.phone}</p>
                        <p><strong>العنوان:</strong> ${order.governorate}, ${order.city}, ${order.address}</p>
                        <p><strong>طريقة الدفع:</strong> ${paymentLabel}</p>
                        <hr>
                        <h3>المنتجات:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="text-align: right; padding: 8px;">المنتج</th>
                                    <th style="text-align: right; padding: 8px;">الكمية</th>
                                    <th style="text-align: right; padding: 8px;">السعر</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                        <hr>
                        <h3 style="text-align: left;">الإجمالي: ${order.total} ج.م</h3>
                    </div>
                `,
            };

            await transporter.sendMail(mailOptions);
            console.log('✅ [Notification] Email sent successfully');
        } catch (error: any) {
            console.error('❌ [Notification] Email Error:', error.message);
        }
    }
}
