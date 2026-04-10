import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a plain text string using AES-256-CBC
 */
export function encryptText(text: string | null | undefined): string | undefined {
    if (!text) return undefined;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        ALGORITHM, 
        Buffer.from(ENCRYPTION_KEY, 'hex').length === 32 ? Buffer.from(ENCRYPTION_KEY, 'hex') : Buffer.alloc(32, ENCRYPTION_KEY), 
        iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts a cipher text string previously encrypted with encryptText
 */
export function decryptText(text: string | null | undefined): string | undefined {
    if (!text) return undefined;
    
    // If it's not encrypted (legacy data), just return it
    if (!text.includes(':')) return text;

    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        
        const decipher = crypto.createDecipheriv(
            ALGORITHM, 
            Buffer.from(ENCRYPTION_KEY, 'hex').length === 32 ? Buffer.from(ENCRYPTION_KEY, 'hex') : Buffer.alloc(32, ENCRYPTION_KEY), 
            iv
        );
        
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString('utf8');
    } catch (e) {
        // Fallback in case of wrong key or corrupted data
        console.error('Failed to decrypt text, returning original or masked:', e);
        return text;
    }
}
