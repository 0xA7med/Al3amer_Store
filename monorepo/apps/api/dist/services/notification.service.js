import axios from 'axios';
import nodemailer from 'nodemailer';
import { decryptText } from '../lib/crypto.utils.js';
import { getMergedSettings } from '../lib/settings-helper.js';
export class NotificationService {
    /**
     * Sends a notification for a new order to all enabled channels
     */
    static async sendNewOrderNotification(order) {
        try {
            console.log(`📤 [NotificationService] Starting notification dispatch for Order #${order?.orderNumber}...`);
            console.log(`📤 [NotificationService] Order paymentMethod: ${order?.paymentMethod}, items: ${order?.items?.length || 0}`);
            const appSettings = await getMergedSettings();
            if (!appSettings || Object.keys(appSettings).length === 0) {
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
                await this.sendWhatsAppCallMeBot(apiKey, appSettings.whatsappRecipientPhone, message);
            }
            else {
                console.log(`⚠️ [WA] WhatsApp skipped — enabled: ${appSettings.whatsappEnabled}, apiKey: ${!!appSettings.whatsappApiKey}, phone: ${!!appSettings.whatsappRecipientPhone}`);
            }
            // 3. Email
            if (appSettings.emailEnabled && appSettings.smtpHost && appSettings.smtpPass) {
                const pass = decryptText(appSettings.smtpPass) ?? appSettings.smtpPass;
                await this.sendEmail(appSettings, pass, order);
            }
            console.log(`✅ [NotificationService] All notification channels processed for Order #${order?.orderNumber}.`);
        }
        catch (error) {
            console.error('❌ [NotificationService] CRITICAL — Failed to send notifications:', error);
        }
    }
    /**
     * Sends a test notification to a specific channel
     */
    static async sendTestNotification(type, config) {
        const testMessage = `🔔 رسالة تجريبية من متجر العامر\n\nإذا كنت ترى هذه الرسالة، فهذا يعني أن نظام إشعارات ${type === 'whatsapp' ? 'الوواتساب' : type === 'telegram' ? 'التليجرام' : 'البريد'} يعمل بنجاح! ✅\n\nالتوقيت: ${new Date().toLocaleString('ar-EG')}`;
        try {
            if (type === 'whatsapp') {
                await this.sendWhatsAppCallMeBot(config.apiKey, config.phone, testMessage);
            }
            else if (type === 'telegram') {
                await this.sendTelegram(config.token, config.chatId, testMessage);
            }
            else if (type === 'email') {
                // Mock a minimal order for the email template
                const mockOrder = {
                    orderNumber: 'TEST-123',
                    fullName: 'مستخدم تجريبي',
                    phone: '+201000000000',
                    governorate: 'القاهرة',
                    city: 'اختبار',
                    address: 'عنوان تجريبي',
                    paymentMethod: 'cod',
                    total: '0',
                    items: [{ name: 'منتج تجريبي', quantity: 1, price: '0' }]
                };
                await this.sendEmail(config, config.pass, mockOrder);
            }
            return { success: true };
        }
        catch (error) {
            console.error(`❌ [NotificationService] Test failure (${type}):`, error);
            throw error;
        }
    }
    static formatOrderMessage(order) {
        const itemsList = order.items?.map((item) => {
            const price = parseFloat(item.price || '0');
            const qty = item.quantity || 1;
            return `• ${item.name} (x${qty}) — ${(price * qty).toLocaleString('en')} ج.م`;
        }).join('\n') || 'لا توجد منتجات';
        const subtotal = parseFloat(order.subtotal || '0');
        const shipping = parseFloat(order.shippingCost || '0');
        const total = parseFloat(order.total || '0');
        const advance = parseFloat(order.codAdvancePayment || '0');
        const atDelivery = parseFloat(order.totalAtDelivery || '0');
        let paymentStatus = '';
        if (order.paymentMethod === 'cod') {
            if (advance > 0) {
                paymentStatus = `💳 *حالة الدفع:* تم دفع عربون (${advance.toLocaleString('en')} ج.م)`;
            }
            else {
                paymentStatus = `💳 *حالة الدفع:* الدفع عند الاستلام بالكامل`;
            }
        }
        else if (order.paymentMethod === 'manual_paid') {
            paymentStatus = `✅ *حالة الدفع:* تم دفع ثمن المنتجات (${subtotal.toLocaleString('en')} ج.م)`;
        }
        else {
            paymentStatus = `✅ *حالة الدفع:* مدفوع إلكترونياً بالكامل`;
        }
        const locationInfo = order.city && order.city !== 'لا يوجد' ? `${order.governorate} - ${order.city}` : `${order.governorate}`;
        const lines = [
            `📦 *طلب جديد رقم ${order.orderNumber}*`,
            order.trader ? `🏪 *التاجر:* ${order.trader.name || order.trader.traderBranding?.storeName || 'تاجر مسجل'}` : '',
            `👤 *العميل:* ${order.fullName}`,
            `📞 *الهاتف:* ${order.phone}`,
            order.phone2 ? `📞 *هاتف إضافي:* ${order.phone2}` : '',
            `📍 *العنوان:* ${locationInfo}`,
            `🏠 *التفاصيل:* ${order.address}`,
            order.notes ? `📝 *الملاحظات:* ${order.notes}` : '',
            '',
            `🛒 *المنتجات:*`,
            itemsList,
            '',
            `💰 *إجمالي قيمة الطلب:* ${subtotal.toLocaleString('en')} ج.م`,
            `💳 *طريقة الدفع:* ${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : order.paymentMethod === 'manual_paid' ? 'مدفوع بالكامل مقدماً' : 'دفع إلكتروني'}`,
            `💵 *المطلوب عند الاستلام:* ${order.paymentMethod === 'manual_paid'
                ? `${shipping.toLocaleString('en')} ج.م (مصاريف الشحن)`
                : `${atDelivery.toLocaleString('en')} ج.م`}`,
            '',
            '---',
            'نتمنى لك يوماً سعيداً! 🚀'
        ];
        return lines.filter(line => line !== null && line !== undefined && line !== '').join('\n');
    }
    static async sendTelegram(token, chatId, message) {
        try {
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            await axios.post(url, {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            });
            console.log('✅ [Notification] Telegram message sent');
        }
        catch (error) {
            console.error('❌ [Notification] Telegram Error:', error.response?.data || error.message);
        }
    }
    static async sendWhatsAppCallMeBot(apiKey, phone, message) {
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
        }
        catch (error) {
            console.error('❌ [WA] WhatsApp FULL Error Object:', JSON.stringify({
                message: error.message,
                status: error.response?.status,
                data: error.response?.data ? String(error.response.data).substring(0, 500) : 'N/A',
            }, null, 2));
        }
    }
    static formatWhatsAppPhone(phone) {
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
    static async sendEmail(settings, pass, order) {
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
            const itemsHtml = order.items?.map((item) => `
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
        }
        catch (error) {
            console.error('❌ [Notification] Email Error:', error.message);
        }
    }
}
//# sourceMappingURL=notification.service.js.map