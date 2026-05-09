export declare class NotificationService {
    /**
     * Sends a notification for a new order to all enabled channels
     */
    static sendNewOrderNotification(order: any): Promise<void>;
    /**
     * Sends a test notification to a specific channel
     */
    static sendTestNotification(type: 'whatsapp' | 'telegram' | 'email', config: any): Promise<{
        success: boolean;
    }>;
    private static formatOrderMessage;
    private static sendTelegram;
    private static sendWhatsAppCallMeBot;
    private static formatWhatsAppPhone;
    private static sendEmail;
}
//# sourceMappingURL=notification.service.d.ts.map