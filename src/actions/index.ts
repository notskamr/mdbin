import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { customUrlRegex, tokenRegex } from '../utils/validation';

import { editBin, getBin, getBinById, newBin } from '../utils/db';
import type { Bin } from '../db';

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
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: e.message || "An error occurred"
                    });
                }
            }

        }
    }),
    editBin: defineAction({
        accept: "form",
        input: z.object({
            binId: z.number(),
            content: z.string(),
            token: z.string(),
        }),
        handler: async ({ binId, content, token }, ctx) => {
            try {
                const bin = await editBin(binId, content, token);
                return {
                    bin,
                    success: true,
                };
            }
            catch (e: any) {
                throw new ActionError({
                    code: "BAD_REQUEST",
                    message: e.message
                });
            }
        }
    }),
};