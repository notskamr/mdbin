export const customUrlRegex = /^[a-zA-Z0-9_-]{6,64}$/;

export function validateCustomUrl(customUrl: string) {
    return customUrlRegex.test(customUrl);
}

export const tokenRegex = /^.{6,64}$/;

export function validateToken(token: string) {
    return tokenRegex.test(token);
}

export function getPattern(regex: RegExp) {
    return regex.source.replace("^", "").replace("$", "");
}
