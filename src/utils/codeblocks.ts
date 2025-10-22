export const LUCIDE_ICONS = {
    copy: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-copy-icon lucide-clipboard-copy"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M16 4h2a2 2 0 0 1 2 2v4"/><path d="M21 14H11"/><path d="m15 10-4 4 4 4"/></svg>',
    link: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link2-icon lucide-link-2"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>',
};

export function calculateIframeHeight(codeLines: number): number {
    const lineHeight = 18;
    const headerHeight = 48;
    const padding = 32;
    return Math.min(Math.max(codeLines * lineHeight + headerHeight + padding, 150), 600);
}

export function generateIframeCode(embedUrl: string, height: number): string {
    return `<iframe src="${embedUrl}" width="100%" height="${height}" frameborder="0" allow="clipboard-write" style="border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden;"></iframe>`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        // clipboard api
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // fallback
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        textarea.style.top = "-999999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            return successful;
        } catch (execErr) {
            console.error("Failed to copy:", execErr);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}
