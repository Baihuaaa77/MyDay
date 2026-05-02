import type { MoodOption } from "../types";

export const MOOD_OPTIONS: readonly MoodOption[] = [
  { id: "fire", emoji: "\u{1F525}", label: "状态火热" },
  { id: "happy", emoji: "\u{1F60A}", label: "心情愉快" },
  { id: "strong", emoji: "\u{1F4AA}", label: "干劲十足" },
  { id: "party", emoji: "\u{1F389}", label: "值得庆祝" },
  { id: "peace", emoji: "\u{1F60C}", label: "平静安宁" },
  { id: "sleepy", emoji: "\u{1F634}", label: "困倦疲惫" },
  { id: "stress", emoji: "\u{1F624}", label: "压力山大" },
  { id: "melt", emoji: "\u{1FAE0}", label: "摆烂躺平" },
];

export function getMoodById(moodId: string | null): MoodOption | undefined {
  if (moodId === null) {
    return undefined;
  }
  return MOOD_OPTIONS.find((m) => m.id === moodId);
}
