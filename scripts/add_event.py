import csv
import os
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "meowmind-data"
METADATA_DIR = DATA_DIR / "metadata"

EVENTS_CSV = METADATA_DIR / "events.csv"


def ensure_file_exists():
    if not EVENTS_CSV.exists():
        raise FileNotFoundError(
            f"File non trovato: {EVENTS_CSV}\n"
            "Controlla di aver creato meowmind-data/metadata/events.csv"
        )


def read_existing_event_ids():
    ids = []
    with open(EVENTS_CSV, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ids.append(row["event_id"])
    return ids


def generate_next_event_id(existing_ids):
    if not existing_ids:
        return "evt_0001"

    max_num = 0
    for event_id in existing_ids:
        try:
            num = int(event_id.replace("evt_", ""))
            if num > max_num:
                max_num = num
        except ValueError:
            continue

    return f"evt_{max_num + 1:04d}"


def prompt_bool(label: str) -> str:
    value = input(f"{label} (true/false): ").strip().lower()
    while value not in {"true", "false"}:
        value = input(f"Inserisci 'true' o 'false' per {label}: ").strip().lower()
    return value


def prompt_float(label: str) -> str:
    value = input(f"{label}: ").strip()
    while True:
        try:
            num = float(value)
            if 0 <= num <= 1:
                return str(num)
        except ValueError:
            pass
        value = input(f"Inserisci un numero tra 0 e 1 per {label}: ").strip()


def main():
    ensure_file_exists()

    existing_ids = read_existing_event_ids()
    event_id = generate_next_event_id(existing_ids)

    print(f"\nNuovo event_id generato: {event_id}\n")

    session_id = input("session_id: ").strip()
    cat_id = input("cat_id: ").strip()
    user_id = input("user_id: ").strip()
    raw_audio_path = input("raw_audio_path: ").strip()
    raw_video_path = input("raw_video_path (puoi lasciare vuoto): ").strip()
    processed_audio_path = input("processed_audio_path: ").strip()
    start_offset_ms = input("start_offset_ms: ").strip()
    end_offset_ms = input("end_offset_ms: ").strip()
    event_type = input("event_type [vocal_event / purr_event / mixed_event / noise_event]: ").strip()
    source_type = input("source_type [manual_capture / passive_capture / imported]: ").strip()
    quality_score = prompt_float("quality_score")
    has_vocalization = prompt_bool("has_vocalization")
    has_video = prompt_bool("has_video")

    row = {
        "event_id": event_id,
        "session_id": session_id,
        "cat_id": cat_id,
        "user_id": user_id,
        "raw_audio_path": raw_audio_path,
        "raw_video_path": raw_video_path,
        "processed_audio_path": processed_audio_path,
        "start_offset_ms": start_offset_ms,
        "end_offset_ms": end_offset_ms,
        "event_type": event_type,
        "source_type": source_type,
        "quality_score": quality_score,
        "has_vocalization": has_vocalization,
        "has_video": has_video,
    }

    with open(EVENTS_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
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
                "has_video",
            ],
        )
        writer.writerow(row)

    print("\nEvento aggiunto con successo.")
    print(f"event_id: {event_id}")
    print(f"File aggiornato: {EVENTS_CSV}")


if __name__ == "__main__":
    main()