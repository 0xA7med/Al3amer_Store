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
            const appSettings = await db.query.settings.findFirst();
            if (!appSettings) return;

            const message = this.formatOrderMessage(order);

            // 1. Telegram
            if (appSettings.telegramEnabled && appSettings.telegramBotToken && appSettings.telegramChatId) {
                const token = decryptText(appSettings.telegramBotToken) ?? appSettings.telegramBotToken;
                await this.sendTelegram(token, appSettings.telegramChatId, message);
            }

            // 2. WhatsApp (CallMeBot)
            if (appSettings.whatsappEnabled && appSettings.whatsappApiKey && appSettings.whatsappRecipientPhone) {
                const apiKey = decryptText(appSettings.whatsappApiKey) ?? appSettings.whatsappApiKey;
                await this.sendWhatsAppCallMeBot(apiKey, appSettings.whatsappRecipientPhone, message);
            }

            // 3. Email
            if (appSettings.emailEnabled && appSettings.smtpHost && appSettings.smtpPass) {
                const pass = decryptText(appSettings.smtpPass) ?? appSettings.smtpPass;
                await this.sendEmail(appSettings, pass, order);
            }

        } catch (error) {
            console.error('❌ [NotificationService] Failed to send notifications:', error);
        }
    }

    private static formatOrderMessage(order: any): string {
        const itemsList = order.items?.map((item: any) => `- ${item.name} (x${item.quantity}) - ${item.price} ج.م`).join('\n') || '';
        
        let paymentInfo = `💳 *طريقة الدفع:* `;
        if (order.paymentMethod === 'cod') {
            if (order.codAdvancePayment && parseFloat(order.codAdvancePayment) > 0) {
                paymentInfo += `عربون (دفع جزئي)\n💸 *المدفوع مقدماً:* ${order.codAdvancePayment} ج.م\n💵 *المطلوب عند الاستلام:* ${order.totalAtDelivery || (parseFloat(order.total) - parseFloat(order.codAdvancePayment))} ج.م`;
            } else {
                paymentInfo += `دفع عند الاستلام\n💵 *المطلوب عند الاستلام:* ${order.totalAtDelivery || order.total} ج.م`;
            }
        } else if (order.paymentMethod === 'manual_paid') {
            paymentInfo += `مدفوع مقدماً بالكامل\n💵 *المطلوب عند الاستلام:* 0 ج.م`;
        } else {
            paymentInfo += `دفع إلكتروني\n💵 *المطلوب عند الاستلام:* 0 ج.م`;
        }

        const locationInfo = order.city && order.city !== 'لا يوجد' ? `${order.governorate} - ${order.city}` : `${order.governorate}`;

        return `📦 *طلب جديد رقم ${order.orderNumber}*
        
👤 *العميل:* ${order.fullName}
📞 *الهاتف:* ${order.phone}
📍 *العنوان:* ${locationInfo}
🏠 *التفاصيل:* ${order.address}
📝 *الملاحظات:* ${order.notes || 'لا يوجد'}

🛒 *المنتجات:*
${itemsList}

💰 *إجمالي قيمة الطلب:* ${order.total} ج.م
${paymentInfo}

---
نتمنى لك يوماً سعيداً! 🚀`;
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
            // CallMeBot API: https://api.callmebot.com/whatsapp.php?phone=[phone]&text=[text]&apikey=[apikey]
            const encodedText = encodeURIComponent(message.replace(/\*/g, '')); // CallMeBot doesn't support markdown well
            const encodedPhone = encodeURIComponent(phone.trim());
            const url = `https://api.callmebot.com/whatsapp.php?phone=${encodedPhone}&text=${encodedText}&apikey=${apiKey}`;
            
            await axios.get(url);
            console.log('✅ [Notification] WhatsApp (CallMeBot) message sent');
        } catch (error: any) {
            console.error('❌ [Notification] WhatsApp Error:', error.message);
        }
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
                        <p><strong>طريقة الدفع:</strong> ${order.paymentMethod === 'cod' ? 'دفع عند الاستلام' : 'دفع إلكتروني'}</p>
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
