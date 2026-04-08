import { CatProfile, DiaryEntry } from "./types";

const PROFILE_KEY = "meowmind_profile";
const DIARY_KEY = "meowmind_diary";

export function loadProfile(): CatProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile: CatProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadDiary(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DIARY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveDiary(entries: DiaryEntry[]) {
  localStorage.setItem(DIARY_KEY, JSON.stringify(entries));
}

export function addDiaryEntry(entry: DiaryEntry) {
  const diary = loadDiary();
  diary.unshift(entry);
  saveDiary(diary.slice(0, 100));
}

export function buildBiasFromDiary(): Partial<Record<any, number>> {
  const diary = loadDiary();
  const counts: Record<string, number> = {};

  for (const item of diary) {
    const k = item.result.topIntent;
    counts[k] = (counts[k] || 0) + 1;
  }

  const total = diary.length || 1;
  const bias: Record<string, number> = {};

  Object.keys(counts).forEach((key) => {
    bias[key] = Math.min(0.2, counts[key] / total / 2);
  });

  return bias;
}