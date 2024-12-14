import type { APIContext } from "astro";

export async function GET(ctx: APIContext) {
    const { customUrl } = ctx.params;

    if (!customUrl) {
        return new Response(null, { status: 404 });
    }

    return ctx.rewrite(
        new Request(new URL("/", ctx.url), {
            headers: {
                "x-custom-url": customUrl
            }
        })
    );
}