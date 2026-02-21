// server/db.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { INITIAL_STATE } from "./constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "database.db");

const db = new Database(DB_PATH);

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS simulation (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    world_state TEXT    NOT NULL,
    chat_history TEXT   NOT NULL DEFAULT '[]',
    updated_at  TEXT    NOT NULL
  );
`);

// Seed with initial state if empty
const existing = db.prepare("SELECT id FROM simulation WHERE id = 1").get();
if (!existing) {
    db.prepare(`
    INSERT INTO simulation (id, world_state, chat_history, updated_at)
    VALUES (1, ?, '[]', datetime('now'))
  `).run(JSON.stringify(INITIAL_STATE));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getState() {
    const row = db.prepare("SELECT world_state FROM simulation WHERE id = 1").get();
    return row ? JSON.parse(row.world_state) : INITIAL_STATE;
}

export function getChatHistory() {
    const row = db.prepare("SELECT chat_history FROM simulation WHERE id = 1").get();
    return row ? JSON.parse(row.chat_history) : [];
}

export function saveSimulation(worldState, chatHistory) {
    db.prepare(`
    UPDATE simulation
    SET world_state = ?, chat_history = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(JSON.stringify(worldState), JSON.stringify(chatHistory));
}

export function resetSimulation() {
    db.prepare(`
    UPDATE simulation
    SET world_state = ?, chat_history = '[]', updated_at = datetime('now')
    WHERE id = 1
  `).run(JSON.stringify(INITIAL_STATE));
}
