import type { MoodOption } from "../types";

/**
 * 10 个预设的每日状态 emoji 选项。
 * 每个选项有唯一 id、emoji 字符、以及鼠标悬停时显示的中文描述。
 */
export const MOOD_OPTIONS: readonly MoodOption[] = [
  { id: "fire", emoji: "\u{1F525}", label: "状态火热" },
  { id: "happy", emoji: "\u{1F60A}", label: "心情愉快" },
  { id: "strong", emoji: "\u{1F4AA}", label: "干劲十足" },
  { id: "star", emoji: "\u{1F31F}", label: "闪闪发光" },
  { id: "party", emoji: "\u{1F389}", label: "值得庆祝" },
  { id: "peace", emoji: "\u{1F60C}", label: "平静安宁" },
  { id: "study", emoji: "\u{1F4DA}", label: "沉浸学习" },
  { id: "sleepy", emoji: "\u{1F634}", label: "困倦疲惫" },
  { id: "stress", emoji: "\u{1F624}", label: "压力山大" },
  { id: "melt", emoji: "\u{1FAE0}", label: "摆烂躺平" },
];

/**
 * 根据 moodId 查找对应的 MoodOption；找不到则返回 undefined。
 * 用于在页面和日历中根据存储的 id 还原出 emoji 和描述。
 */
export function getMoodById(moodId: string | null): MoodOption | undefined {
  if (moodId === null) {
    return undefined;
  }
  return MOOD_OPTIONS.find((m) => m.id === moodId);
}
