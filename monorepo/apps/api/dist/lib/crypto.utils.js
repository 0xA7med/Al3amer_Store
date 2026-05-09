import crypto from 'crypto';
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    throw new Error('CRITICAL: ENCRYPTION_KEY environment variable is not set. All encrypted data (API keys, payment credentials) will be inaccessible without it.');
}
const IV_LENGTH = 16; // For AES, this is always 16
/**
 * Encrypts a plain text string using AES-256-CBC
 */
export function encryptText(text) {
    if (!text)
        return undefined;
    const keyStr = ENCRYPTION_KEY;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(keyStr, 'hex').length === 32 ? Buffer.from(keyStr, 'hex') : Buffer.alloc(32, keyStr), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
/**
 * Decrypts a cipher text string previously encrypted with encryptText
 */
export function decryptText(text) {
    if (!text)
        return undefined;
    // If it's not encrypted (legacy data), just return it
    if (!text.includes(':'))
        return text;
    try {
        const textParts = text.split(':');
        if (textParts.length < 2)
            return text; // Actually impossible due to includes(':') above but safe
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const keyStr = ENCRYPTION_KEY;
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(keyStr, 'hex').length === 32 ? Buffer.from(keyStr, 'hex') : Buffer.alloc(32, keyStr), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    }
    catch (e) {
        // Fallback in case of wrong key or corrupted data
        console.error('❌ Decryption failed. This usually means ENCRYPTION_KEY has changed or is invalid.');
        return undefined; // Return undefined to signal failure
    }
}
//# sourceMappingURL=crypto.utils.js.map