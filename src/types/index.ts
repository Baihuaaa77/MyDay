/**
 * MyDay 核心数据类型。
 */

/** 单个任务 */
export interface Task {
  /** 唯一标识，使用 crypto.randomUUID() 生成 */
  id: string;
  /** 任务标题 */
  title: string;
  /** 是否完成 */
  completed: boolean;
  /** 创建时间的 ISO 字符串 */
  createdAt: string;
  /** 完成时间的 ISO 字符串；未完成时为空 */
  completedAt?: string;
  /** 从哪一天自动结转而来；普通手动任务为空 */
  carryoverFromDate?: string;
  /** 从哪条任务自动结转而来；用于避免重复结转 */
  carryoverFromTaskId?: string;
}

/** 每日记录（以 date 为主键的一条「当天快照」） */
export interface DayRecord {
  /** 日期字符串，格式为 "YYYY-MM-DD"，作为唯一主键 */
  date: string;
  /** 当天的任务列表 */
  tasks: Task[];
  /** 已经执行过自动结转检查的来源日期，避免删除结转任务后再次出现 */
  carryoverCheckedDates?: string[];
  /** 自评分数 1～10，未评分时为 null */
  rating: number | null;
  /** 当日记录（备注），可为空字符串 */
  note: string;
  /** 当日状态 emoji 的 id（对应 MOOD_OPTIONS 中的某项），未选择时为 null */
  moodId: string | null;
  /** 最近一次修改时间的 ISO 字符串 */
  updatedAt?: string;
}

/** 一个可选的「每日状态 emoji」选项。 */
export interface MoodOption {
  /** 唯一标识，存入 DayRecord.moodId */
  id: string;
  /** 显示的 emoji 字符 */
  emoji: string;
  /** 文字描述 */
  label: string;
}

/** 页面引言一条：正文 + 署名 */
export interface QuoteEntry {
  text: string;
  author: string;
}
