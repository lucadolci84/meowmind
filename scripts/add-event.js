const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = process.cwd();
const EVENTS_CSV = path.join(ROOT, "meowmind-data", "metadata", "events.csv");

function ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File non trovato: ${filePath}`);
        process.exit(1);
    }
}

function readCsv(filePath) {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) return [];
    const lines = raw.split(/\r?\n/);
    const headers = lines[0].split(",");
    return lines.slice(1).map((line) => {
        const values = line.split(",");
        const row = {};
        headers.forEach((h, i) => {
            row[h] = values[i] ?? "";
        });
        return row;
    });
}

function generateNextEventId(rows) {
    let maxNum = 0;
    for (const row of rows) {
        const eventId = row.event_id || "";
        const match = eventId.match(/^evt_(\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
        }
    }
    return `evt_${String(maxNum + 1).padStart(4, "0")}`;
}

function appendCsvRow(filePath, row, headers) {
    const line = headers.map((h) => row[h] ?? "").join(",");
    fs.appendFileSync(filePath, `\n${line}`, "utf8");
}

function askQuestion(rl, label) {
    return new Promise((resolve) => {
        rl.question(`${label}: `, (answer) => resolve(answer.trim()));
    });
}

async function askBool(rl, label) {
    while (true) {
        const value = (await askQuestion(rl, `${label} (true/false)`)).toLowerCase();
        if (value === "true" || value === "false") return value;
        console.log("Inserisci solo true oppure false.");
    }
}

async function askFloat01(rl, label) {
    while (true) {
        const value = await askQuestion(rl, label);
        const num = Number(value);
        if (!Number.isNaN(num) && num >= 0 && num <= 1) return String(num);
        console.log("Inserisci un numero tra 0 e 1.");
    }
}

async function main() {
    ensureFileExists(EVENTS_CSV);

    const rows = readCsv(EVENTS_CSV);
    const eventId = generateNextEventId(rows);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(`\nNuovo event_id generato: ${eventId}\n`);

    const row = {
        event_id: eventId,
        session_id: await askQuestion(rl, "session_id"),
        cat_id: await askQuestion(rl, "cat_id"),
        user_id: await askQuestion(rl, "user_id"),
        raw_audio_path: await askQuestion(rl, "raw_audio_path"),
        raw_video_path: await askQuestion(rl, "raw_video_path (puoi lasciarlo vuoto)"),
        processed_audio_path: await askQuestion(rl, "processed_audio_path"),
        start_offset_ms: await askQuestion(rl, "start_offset_ms"),
        end_offset_ms: await askQuestion(rl, "end_offset_ms"),
        event_type: await askQuestion(
            rl,
            "event_type [vocal_event / purr_event / mixed_event / noise_event]"
        ),
        source_type: await askQuestion(
            rl,
            "source_type [manual_capture / passive_capture / imported]"
        ),
        quality_score: await askFloat01(rl, "quality_score"),
        has_vocalization: await askBool(rl, "has_vocalization"),
        has_video: await askBool(rl, "has_video")
    };

    rl.close();

    const headers = [
        "event_id",
        "session_id",
        "cat_id",
        "user_id",
        "raw_audio_path",
        "raw_video_path",
        "processed_audio_path",
        "start_offset_ms",
        "end_offset_ms",
        "event_type",
        "source_type",
        "quality_score",
        "has_vocalization",
        "has_video"
    ];

    appendCsvRow(EVENTS_CSV, row, headers);

    console.log("\nEvento aggiunto con successo.");
    console.log(`event_id: ${eventId}`);
    console.log(`File aggiornato: ${EVENTS_CSV}`);
}

main().catch((err) => {
    console.error("Errore:", err);
    process.exit(1);
});