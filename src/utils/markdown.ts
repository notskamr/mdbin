import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import sanitizeHtml from "sanitize-html";

export function createMarkedInstance() {
    return new Marked(
        markedHighlight({
            emptyLangClass: "hljs",
            langPrefix: "hljs language-",
            highlight(code, lang, info) {
                const language = hljs.getLanguage(lang) ? lang : "plaintext";
                return hljs.highlight(code, { language }).value;
            },
        })
    );
}

export function sanitizeMarkdown(html: string) {
    return sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        allowedClasses: {
            pre: ["astro-code", "github-dark", "github-light", "hljs"],
            code: [/^(astro-code|github-dark|github-light|hljs|language-.*)$/],
            span: [/^hljs-.*/],
        },
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            pre: ["data-language", "style", "tabindex"],
            code: ["data-language", "style"],
            span: ["style"],
            p: ["style"],
            img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
        },
        allowedStyles: {
            "*": {
                color: [
                    /^#(0x)?[0-9a-f]+$/i,
                    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
                ],
                "background-color": [
                    /^#(0x)?[0-9a-f]+$/i,
                    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
                ],
                "text-align": [/^left$/, /^right$/, /^center$/],
                "font-size": [/^\d+(?:px|em|%)$/],
                "overflow-x": [/^auto$/, /^scroll$/],
                "overflow-y": [/^auto$/, /^scroll$/],
                overflow: [/^auto$/, /^scroll$/],
            },
        },
    });
}

export async function parseMarkdown(content: string) {
    const marked = createMarkedInstance();
    const parsed = await marked.parse(content);
    return sanitizeMarkdown(parsed);
}

export function extractCodeBlock(html: string, blockIndex: number) {
    const codeBlockRegex = /<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g;
    const blocks = [...html.matchAll(codeBlockRegex)];

    if (blockIndex >= blocks.length) {
        return null;
    }

    const codeAttrs = blocks[blockIndex][1];
    const codeContent = blocks[blockIndex][0];

    // extract lang
    const langMatch = codeAttrs.match(/class="[^"]*language-(\w+)[^"]*"/);
    const language = langMatch ? langMatch[1] : "plaintext";

    return {
        html: codeContent,
        language,
    };
}
