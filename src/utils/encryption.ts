const ENCRYPTION_VERSION = "enc:v1";
const PREFIX = `${ENCRYPTION_VERSION}::`;
const IV_LENGTH = 12;

let cachedKey: Promise<CryptoKey> | null = null;

function getKey() {
    const secret = import.meta.env.CONTENT_ENCRYPTION_KEY;
    if (!secret) {
        throw new Error("CONTENT_ENCRYPTION_KEY is not set");
    }

    cachedKey ??= crypto.subtle.importKey(
        "raw",
        base64ToBytes(secret),
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );

    return cachedKey;
}

export async function encryptContent(content: string) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(content)
    );

    const payload = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
    payload.set(iv);
    payload.set(new Uint8Array(ciphertext), IV_LENGTH);

    return `${PREFIX}${bytesToBase64(payload)}`;
}

export async function decryptContent(stored: string) {
    // Rows written before encryption was introduced are still plaintext.
    if (!stored.startsWith(PREFIX)) {
        return stored;
    }

    const payload = base64ToBytes(stored.slice(PREFIX.length));
    const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: payload.subarray(0, IV_LENGTH) },
        await getKey(),
        payload.subarray(IV_LENGTH)
    );

    return new TextDecoder().decode(plaintext);
}

function bytesToBase64(bytes: Uint8Array) {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function base64ToBytes(base64: string) {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}
