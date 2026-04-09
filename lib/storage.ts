import { CatProfile, DiaryEntry, LiveSnapshot, MeowIntent } from "./types";

const PROFILE_KEY = "meowmind_profile";
const DIARY_KEY = "meowmind_diary";
const LIVE_SNAPSHOTS_KEY = "meowmind_live_snapshots";

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

export function buildBiasFromDiary(): Partial<Record<MeowIntent, number>> {
  const diary = loadDiary();
  const counts: Partial<Record<MeowIntent, number>> = {};

  for (const item of diary) {
    const key = item.result.topIntent;
    counts[key] = (counts[key] || 0) + 1;
  }

  const total = diary.length || 1;
  const bias: Partial<Record<MeowIntent, number>> = {};

  (Object.keys(counts) as MeowIntent[]).forEach((key) => {
    bias[key] = Math.min(0.2, (counts[key] || 0) / total / 2);
  });

  return bias;
}

export function loadLiveSnapshots(): LiveSnapshot[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LIVE_SNAPSHOTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveLiveSnapshots(entries: LiveSnapshot[]) {
  localStorage.setItem(LIVE_SNAPSHOTS_KEY, JSON.stringify(entries));
}

export function addLiveSnapshot(entry: LiveSnapshot) {
  const entries = loadLiveSnapshots();
  entries.unshift(entry);
  saveLiveSnapshots(entries.slice(0, 50));
}

import { DatasetEventDraft } from "./types";

const DATASET_DRAFTS_KEY = "meowmind_dataset_drafts";

export function loadDatasetDrafts(): DatasetEventDraft[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(DATASET_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
}

export function saveDatasetDrafts(entries: DatasetEventDraft[]) {
    localStorage.setItem(DATASET_DRAFTS_KEY, JSON.stringify(entries));
}

export function addDatasetDraft(entry: DatasetEventDraft) {
    const entries = loadDatasetDrafts();
    entries.unshift(entry);
    saveDatasetDrafts(entries.slice(0, 200));
}

export function deleteDatasetDraft(id: string) {
    const entries = loadDatasetDrafts().filter((item) => item.id !== id);
    saveDatasetDrafts(entries);
}