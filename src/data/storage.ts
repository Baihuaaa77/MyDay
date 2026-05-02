import type { DayRecord } from "../types";

/** localStorage 中存放全部每日记录的键名。 */
const STORAGE_KEY = "myday-records";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function createEmptyRecord(date: string): DayRecord {
  return {
    date,
    tasks: [],
    rating: null,
    note: "",
    moodId: null,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }
  return value >= 1 && value <= 10 ? value : null;
}

function normalizeRecord(dateKey: string, value: unknown): DayRecord | null {
  if (!DATE_KEY_PATTERN.test(dateKey) || !isPlainObject(value)) {
    return null;
  }

  const tasks = Array.isArray(value.tasks)
    ? value.tasks.flatMap((taskValue) => {
        if (!isPlainObject(taskValue) || typeof taskValue.title !== "string") {
          return [];
        }

        return [
          {
            id:
              typeof taskValue.id === "string" && taskValue.id.trim() !== ""
                ? taskValue.id
                : crypto.randomUUID(),
            title: taskValue.title,
            completed: taskValue.completed === true,
            createdAt:
              typeof taskValue.createdAt === "string"
                ? taskValue.createdAt
                : new Date().toISOString(),
          },
        ];
      })
    : [];

  return {
    date: dateKey,
    tasks,
    rating: normalizeRating(value.rating),
    note: typeof value.note === "string" ? value.note : "",
    moodId: typeof value.moodId === "string" ? value.moodId : null,
  };
}

function normalizeRecords(value: unknown): Record<string, DayRecord> {
  if (!isPlainObject(value)) {
    return {};
  }

  const normalized: Record<string, DayRecord> = {};
  for (const [dateKey, recordValue] of Object.entries(value)) {
    const record = normalizeRecord(dateKey, recordValue);
    if (record !== null) {
      normalized[dateKey] = record;
    }
  }
  return normalized;
}

/**
 * 将 localStorage 中的原始字符串解析为「日期 -> DayRecord」映射。
 * 若键不存在、内容非法或 JSON 损坏，则返回空对象，避免应用崩溃。
 */
function parseAllRecords(raw: string | null): Record<string, DayRecord> {
  if (raw === null || raw === "") {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return normalizeRecords(parsed);
  } catch {
    return {};
  }
}

/**
 * 读取 localStorage 中保存的全部每日记录，返回以日期字符串为键的对象。
 * 类比 Python：相当于从磁盘读一个 dict，键是 "YYYY-MM-DD"，值是 DayRecord。
 */
export function getAllRecords(): Record<string, DayRecord> {
  return parseAllRecords(localStorage.getItem(STORAGE_KEY));
}

/**
 * 根据日期（"YYYY-MM-DD"）获取该日的 DayRecord。
 * 若该日尚未在本地保存过，则返回一个「空」的 DayRecord（仅设置 date，tasks 为空、rating 为 null、note 为空串），
 * 且不会自动写入 localStorage；只有调用 saveRecord 时才会持久化。
 */
export function getRecord(date: string): DayRecord {
  const all = getAllRecords();
  const existing = all[date];
  if (existing !== undefined) {
    return existing;
  }
  return createEmptyRecord(date);
}

/**
 * 保存一条 DayRecord：以 record.date 为键，合并进全量映射后写回 localStorage。
 * 若同一天已存在记录，会被本次传入的 record 覆盖。
 */
export function saveRecord(record: DayRecord): void {
  const all = getAllRecords();
  all[record.date] = record;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function exportRecordsJson(): string {
  return JSON.stringify(
    {
      app: "MyDay",
      version: 1,
      exportedAt: new Date().toISOString(),
      records: getAllRecords(),
    },
    null,
    2,
  );
}

export function importRecordsJson(raw: string): number {
  const parsed: unknown = JSON.parse(raw);
  const source = isPlainObject(parsed) && "records" in parsed ? parsed.records : parsed;
  const incoming = normalizeRecords(source);
  const current = getAllRecords();
  const next = { ...current, ...incoming };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return Object.keys(incoming).length;
}
