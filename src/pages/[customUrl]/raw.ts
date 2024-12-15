import type { APIContext } from "astro";
import { getBin } from "../../utils/db";

export async function GET(ctx: APIContext) {
    const { customUrl } = ctx.params;

    if (!customUrl) {
        return new Response(null, { status: 404 });
    }

    const bin = await getBin(customUrl);

    if (!bin) {
        return new Response(null, { status: 404 });
    }

    return new Response(bin.content, {
        headers: {
            "content-type": "text/markdown"
        }
    });

}