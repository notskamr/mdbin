const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version",
};

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json",
            ...CORS_HEADERS,
            ...headers,
        },
    });
}

export function jsonError(message: string, status = 400) {
    return json({ error: message }, status);
}

export function corsPreflight() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}
