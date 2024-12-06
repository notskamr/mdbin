import { turso, type Bin } from "../db";
import { hashString, verifyString } from "./hashing";
import { formatToken, generateCustomUrl, generateToken, parseToken } from "./general";
import { validateCustomUrl, validateToken } from "./validation";

export async function newBin(content: string, customUrl?: string, token?: string) {
    // Regex to validate custom URL
    if (customUrl && validateCustomUrl(customUrl)) {
        throw new Error("Invalid custom URL - must be alphanumeric and less than 64 characters");
    }

    if (token && validateToken(token)) {
        throw new Error("Invalid token - must be between 6 and 64 characters");
    }

    if (!customUrl) {
        // Generate a random url if not provided
        customUrl = generateCustomUrl();
    }

    if (!token) {
        // Generate a random token if not provided
        token = generateToken();
    }

    // Hash any given password
    const hashedToken = formatToken("v1", await hashString(token));

    const { rows: [{ id: binId }] } = await turso.execute({
        sql: `INSERT INTO markdown_bins (custom_url, content) VALUES (?, ?) RETURNING id`,
        args: [customUrl, content],
    });

    await turso.execute({
        sql: `INSERT INTO edit_tokens (bin_id, token) VALUES (?, ?)`,
        args: [binId, hashedToken],
    });

    return {
        binId,
        customUrl,
        token,
    };
}

export async function getBin(customUrl: string) {
    const res = await turso.execute({
        sql: `SELECT * FROM markdown_bins WHERE custom_url = ?`,
        args: [customUrl],
    });

    return res.rows[0] as unknown as Bin;
}

export async function editBin(binId: number, content: string, token: string) {

    if (!await verifyBin(binId, token)) {
        throw new Error("Invalid token");
    }

    await turso.execute({
        sql: `UPDATE markdown_bins SET content = ? WHERE id = ?`,
        args: [content, binId],
    });
}

export async function deleteBin(binId: number, token: string) {

    if (!await verifyBin(binId, token)) {
        throw new Error("Invalid token");
    }

    await turso.execute({
        sql: `DELETE FROM markdown_bins WHERE id = ?`,
        args: [binId],
    });
}

export async function verifyBin(binId: number, token: string) {
    const { rows } = await turso.execute({
        sql: `SELECT * FROM edit_tokens WHERE bin_id = ?`,
        args: [binId],
    });

    if (rows.length === 0) {
        throw new Error("Bin not found");
    }

    const { token: hashedTokenField } = rows[0] as unknown as { token: string; };

    if (!hashedTokenField) {
        throw new Error("No token set for this bin");
    }

    const [hashVersion, hashedToken] = parseToken(hashedTokenField);

    return await verifyString(hashedToken, token);
}

export async function checkCustomUrlAvailable(customUrl: string) {
    const { rows } = await turso.execute({
        sql: `SELECT * FROM markdown_bins WHERE custom_url = ?`,
        args: [customUrl],
    });

    return rows.length === 0;
}