import type { APIContext } from "astro";
import { z } from "astro:schema";
import { tokenRegex } from "../../../utils/validation";
import { editBin } from "../../../utils/db";
import { corsPreflight, json, jsonError } from "../../../utils/api";

const schema = z.object({
    content: z.string().min(1, "Content cannot be empty"),
    token: z.string().regex(tokenRegex, "Invalid token: must be 6-64 characters"),
});

export function OPTIONS() {
    return corsPreflight();
}

export async function PATCH(ctx: APIContext) {
    const binId = Number(ctx.params.binId);
    if (!Number.isInteger(binId) || binId <= 0) {
        return jsonError("Invalid bin ID", 400);
    }

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

    const { content, token } = parsed.data;

    try {
        const bin = await editBin(binId, content, token);
        return json({
            id: bin.id,
            customUrl: bin.customUrl,
            content: bin.content,
            createdAt: bin.createdAt,
            updatedAt: bin.updatedAt,
            url: new URL(`/${bin.customUrl}`, ctx.url).toString(),
        });
    } catch (e: any) {
        const message = e.message || "An error occurred";
        const status = message.includes("Invalid token")
            ? 401
            : message.includes("not found")
                ? 404
                : 400;
        return jsonError(message, status);
    }
}
