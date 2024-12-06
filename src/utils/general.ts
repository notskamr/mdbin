export function parseToken(token: string) {
    const s = token.split("::");
    if (s.length === 1) {
        return [
            s[0],
            "",
        ];
    }
    return [s[0], s.slice(1).join("::")];
}

export function formatToken(hashVersion: string, token: string) {
    return `${hashVersion}::${token}`;
}

export function generateCustomUrl() {
    return Math.random().toString(36).substring(2, 8);
}

export function generateToken() {
    return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
}