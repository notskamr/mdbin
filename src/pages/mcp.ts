import type { APIContext } from "astro";
import { z } from "astro:schema";
import { customUrlRegex, tokenRegex } from "../utils/validation";
import { editBin, getBin, newBin } from "../utils/db";
import { corsPreflight, json, jsonError } from "../utils/api";

const PROTOCOL_VERSION = "2025-06-18";

const SERVER_INFO = {
    name: "mdbin",
    title: "mdbin",
    version: "1.0.0",
};

const TOOLS = [
    {
        name: "create_bin",
        title: "Create a bin",
        description:
            "Create a new markdown bin and return its public URL along with the edit token needed to change it later. Always report the edit token back to the user — it cannot be recovered.",
        inputSchema: {
            type: "object",
            properties: {
                content: {
                    type: "string",
                    description: "The markdown content of the bin.",
                },
                customUrl: {
                    type: "string",
                    description:
                        "Optional URL slug, 6-64 characters of letters, numbers, hyphens, or underscores. Randomly generated if omitted.",
                },
                token: {
                    type: "string",
                    description:
                        "Optional edit token, 6-64 characters. Randomly generated if omitted.",
                },
            },
            required: ["content"],
        },
    },
    {
        name: "edit_bin",
        title: "Edit a bin",
        description:
            "Replace the content of an existing bin. Requires the bin's numeric id and the edit token issued when it was created.",
        inputSchema: {
            type: "object",
            properties: {
                binId: {
                    type: "number",
                    description: "The numeric id returned by create_bin.",
                },
                content: {
                    type: "string",
                    description:
                        "The new markdown content. This replaces the existing content entirely.",
                },
                token: {
                    type: "string",
                    description: "The edit token for this bin.",
                },
            },
            required: ["binId", "content", "token"],
        },
    },
    {
        name: "read_bin",
        title: "Read a bin",
        description:
            "Fetch the raw markdown of a bin by its URL slug. No edit token required — bins are publicly readable.",
        inputSchema: {
            type: "object",
            properties: {
                customUrl: {
                    type: "string",
                    description: "The bin's URL slug, e.g. 'my-notes'.",
                },
            },
            required: ["customUrl"],
        },
    },
];

const createSchema = z.object({
    content: z.string().min(1, "Content cannot be empty"),
    customUrl: z
        .string()
        .regex(customUrlRegex, "Invalid custom URL: must be 6-64 characters, only letters, numbers, hyphens, and underscores")
        .optional(),
    token: z
        .string()
        .regex(tokenRegex, "Invalid token: must be 6-64 characters")
        .optional(),
});

const editSchema = z.object({
    binId: z.number().int().positive(),
    content: z.string().min(1, "Content cannot be empty"),
    token: z.string().regex(tokenRegex, "Invalid token: must be 6-64 characters"),
});

const readSchema = z.object({
    customUrl: z.string().min(1, "A customUrl is required"),
});

export function OPTIONS() {
    return corsPreflight();
}

export function GET() {
    return jsonError("This MCP endpoint is stateless; use POST for JSON-RPC requests", 405);
}

export async function POST(ctx: APIContext) {
    let message: any;
    try {
        message = await ctx.request.json();
    } catch {
        return json(rpcError(null, -32700, "Parse error"));
    }

    if (Array.isArray(message)) {
        return json(rpcError(null, -32600, "Batch requests are not supported"));
    }

    const { id, method, params } = message ?? {};
    const isNotification = id === undefined || id === null;

    switch (method) {
        case "initialize":
            return json(
                rpcResult(id, {
                    protocolVersion:
                        typeof params?.protocolVersion === "string"
                            ? params.protocolVersion
                            : PROTOCOL_VERSION,
                    capabilities: { tools: {} },
                    serverInfo: SERVER_INFO,
                })
            );

        case "tools/list":
            return json(rpcResult(id, { tools: TOOLS }));

        case "tools/call":
            return json(rpcResult(id, await callTool(params, ctx)));

        case "ping":
            return json(rpcResult(id, {}));

        default:
            // Notifications get no response body, per JSON-RPC.
            if (isNotification) {
                return new Response(null, { status: 202 });
            }
            return json(rpcError(id, -32601, `Unknown method: ${method}`));
    }
}

async function callTool(params: any, ctx: APIContext) {
    const args = params?.arguments ?? {};

    try {
        switch (params?.name) {
            case "create_bin": {
                const { content, customUrl, token } = parse(createSchema, args);
                const bin = await newBin(content, customUrl, token);
                return toolResult({
                    binId: bin.binId,
                    customUrl: bin.customUrl,
                    token: bin.token,
                    url: binUrl(ctx, bin.customUrl),
                });
            }

            case "edit_bin": {
                const { binId, content, token } = parse(editSchema, args);
                const bin = await editBin(binId, content, token);
                return toolResult({
                    binId: bin.id,
                    customUrl: bin.customUrl,
                    updatedAt: bin.updatedAt,
                    url: binUrl(ctx, bin.customUrl),
                });
            }

            case "read_bin": {
                const { customUrl } = parse(readSchema, args);
                const bin = await getBin(customUrl);
                if (!bin) {
                    return toolError(`No bin found at '${customUrl}'`);
                }
                return toolResult(bin.content, false);
            }

            default:
                return toolError(`Unknown tool: ${params?.name}`);
        }
    } catch (e: any) {
        if (e.message?.includes("UNIQUE constraint failed")) {
            return toolError("That custom URL is already taken");
        }
        return toolError(e.message || "An error occurred");
    }
}

function parse<T extends z.ZodTypeAny>(schema: T, args: unknown): z.infer<T> {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid arguments");
    }
    return parsed.data;
}

function binUrl(ctx: APIContext, customUrl: string) {
    return new URL(`/${customUrl}`, ctx.url).toString();
}

function toolResult(payload: unknown, asJson = true) {
    return {
        content: [
            {
                type: "text",
                text: asJson ? JSON.stringify(payload, null, 2) : String(payload),
            },
        ],
    };
}

function toolError(message: string) {
    return {
        content: [{ type: "text", text: message }],
        isError: true,
    };
}

function rpcResult(id: unknown, result: unknown) {
    return { jsonrpc: "2.0", id, result };
}

function rpcError(id: unknown, code: number, message: string) {
    return { jsonrpc: "2.0", id, error: { code, message } };
}
