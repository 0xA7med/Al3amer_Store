import { db } from '../db/index.js';
export async function getMergedSettings() {
    const [core, payment, notification, ai, shipping] = await Promise.all([
        db.query.settings.findFirst(),
        db.query.paymentSettings.findFirst(),
        db.query.notificationSettings.findFirst(),
        db.query.aiSettings.findFirst(),
        db.query.shippingSettings.findFirst(),
    ]);
    if (!core)
        return {};
    return {
        ...core,
        ...(payment ? omitSystemFields(payment) : {}),
        ...(notification ? omitSystemFields(notification) : {}),
        ...(ai ? omitSystemFields(ai) : {}),
        ...(shipping ? omitSystemFields(shipping) : {}),
    };
}
function omitSystemFields(obj) {
    const { id, settingsId, createdAt, updatedAt, ...rest } = obj;
    return rest;
}
//# sourceMappingURL=settings-helper.js.map