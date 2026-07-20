import type { APIContext } from "astro";
import { z } from "astro:schema";
import { customUrlRegex, tokenRegex } from "../../../utils/validation";
import { newBin } from "../../../utils/db";
import { corsPreflight, json, jsonError } from "../../../utils/api";

const schema = z.object({
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

export function OPTIONS() {
    return corsPreflight();
}

export async function POST(ctx: APIContext) {
    let body: unknown;
    try {
        body = await ctx.request.json();
    } catch {
        return jsonError("Invalid JSON body", 400);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }

    const { content, customUrl, token } = parsed.data;

    try {
        const bin = await newBin(content, customUrl, token);
        return json(
            {
                binId: bin.binId,
                customUrl: bin.customUrl,
                token: bin.token,
                url: new URL(`/${bin.customUrl}`, ctx.url).toString(),
            },
            201
        );
    } catch (e: any) {
        if (e.message?.includes("UNIQUE constraint failed")) {
            return jsonError("Custom URL already taken", 409);
        }
        return jsonError(e.message || "An error occurred", 400);
    }
}
