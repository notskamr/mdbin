import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { customUrlRegex, tokenRegex } from '../utils/validation';

import { newBin } from '../utils/db';

export const server = {
    newBin: defineAction({
        accept: "form",
        input: z.object({
            content: z.string(),
            customUrl: z.string().regex(customUrlRegex).optional(),
            token: z.string().regex(tokenRegex).optional(),
        }),
        handler: async ({ content, customUrl, token }, ctx) => {
            try {
                const bin = await newBin(content, customUrl, token);
                return {
                    binId: bin.binId,
                    customUrl: bin.customUrl,
                    token: bin.token,
                };
            }
            catch (e: any) {
                // If the custom URL is already taken, we'll return an error.
                if (e.message.includes("UNIQUE constraint failed")) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: "Custom URL already taken"
                    });
                }
                else {
                    console.error(e);
                }
            }

        }
    })
};