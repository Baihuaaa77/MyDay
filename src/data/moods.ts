import type { MoodOption } from "../types";

export const MOOD_OPTIONS: readonly MoodOption[] = [
  { id: "fire", emoji: "\u{1F525}", label: "火热" },
  { id: "happy", emoji: "\u{1F60A}", label: "开心" },
  { id: "party", emoji: "\u{1F389}", label: "庆祝" },
  { id: "peace", emoji: "\u{1F60C}", label: "平静" },
  { id: "sleepy", emoji: "\u{1F634}", label: "疲惫" },
  { id: "melt", emoji: "\u{1FAE0}", label: "压力" },
  { id: "sad", emoji: "\u{1F622}", label: "难过" },
];

export function getMoodById(moodId: string | null): MoodOption | undefined {
  if (moodId === null) {
    return undefined;
  }
  return MOOD_OPTIONS.find((m) => m.id === moodId);
}
