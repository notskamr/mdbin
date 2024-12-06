import { createClient } from "@libsql/client/web";

export const turso = createClient({
    url: import.meta.env.TURSO_DB_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN || "",
});

const schemaStatements = [
    `
    CREATE TABLE IF NOT EXISTS markdown_bins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        custom_url TEXT UNIQUE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS edit_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bin_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(bin_id) REFERENCES markdown_bins(id) ON DELETE CASCADE
    );
    `
];

export interface Bin {
    id: number;
    customUrl: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface EditToken {
    id: number;
    binId: number;
    token: string;
    createdAt: string;
}

(async () => {
    for (const query of schemaStatements) {
        await turso.execute(query);
    }
    console.log("Schema created successfully.");
})();

