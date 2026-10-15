import type { DayRecord, Task } from "../types";
import { addCalendarDays, getTodayString } from "../utils/dateUtils";

const DB_NAME = "myday-db";
const DB_VERSION = 1;
const RECORD_STORE_NAME = "records";
const LEGACY_STORAGE_KEY = "myday-records";
const MIGRATION_FLAG_KEY = "myday-indexeddb-migrated";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** 自动结转最多向前回看的天数：中间断档几天时仍能找回未完成任务 */
const CARRYOVER_LOOKBACK_DAYS = 7;

/* ------------------------------------------------------------------ */
/* 工具                                                                */
/* ------------------------------------------------------------------ */

/**
 * crypto.randomUUID 只在安全上下文（HTTPS / localhost）可用；
 * 手机通过局域网 http 地址访问开发服务器时需要回退方案。
 */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyRecord(date: string): DayRecord {
  return {
    date,
    tasks: [],
    carryoverCheckedDates: [],
    rating: null,
    note: "",
    moodId: null,
  };
}

/** 记录里是否有用户留下的实质内容（用于日历标记与统计）。 */
export function hasRecordContent(record: DayRecord | undefined): boolean {
  if (record === undefined) {
    return false;
  }
  return (
    record.tasks.length > 0 ||
    record.rating !== null ||
    record.moodId !== null ||
    record.note.trim() !== ""
  );
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

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function normalizeTask(value: unknown): Task | null {
  if (!isPlainObject(value) || typeof value.title !== "string" || value.title.trim() === "") {
    return null;
  }
  const completed = value.completed === true;
  return {
    id: typeof value.id === "string" && value.id.trim() !== "" ? value.id : createId(),
    title: value.title,
    completed,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    completedAt: completed ? optionalString(value.completedAt) : undefined,
    carryoverFromDate: optionalString(value.carryoverFromDate),
    carryoverFromTaskId: optionalString(value.carryoverFromTaskId),
  };
}

function normalizeRecord(dateKey: string, value: unknown): DayRecord | null {
  if (!DATE_KEY_PATTERN.test(dateKey) || !isPlainObject(value)) {
    return null;
  }

  const seenIds = new Set<string>();
  const tasks = Array.isArray(value.tasks)
    ? value.tasks.flatMap((taskValue) => {
        const task = normalizeTask(taskValue);
        if (task === null) {
          return [];
        }
        // 重复 id 会让 React 列表与排序逻辑出错，遇到时重新分配
        if (seenIds.has(task.id)) {
          task.id = createId();
        }
        seenIds.add(task.id);
        return [task];
      })
    : [];

  const carryoverCheckedDates = Array.isArray(value.carryoverCheckedDates)
    ? value.carryoverCheckedDates.filter(
        (dateValue): dateValue is string =>
          typeof dateValue === "string" && DATE_KEY_PATTERN.test(dateValue),
      )
    : [];

  return {
    date: dateKey,
    tasks,
    carryoverCheckedDates,
    rating: normalizeRating(value.rating),
    note: typeof value.note === "string" ? value.note : "",
    moodId: typeof value.moodId === "string" && value.moodId !== "" ? value.moodId : null,
    updatedAt: optionalString(value.updatedAt),
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

/* ------------------------------------------------------------------ */
/* 变更通知：同一页面内的各个视图 + 其他标签页                          */
/* ------------------------------------------------------------------ */

export interface RecordsChange {
  /** 发生变化的记录；为 null 表示需要整体重新读取（导入、其他标签页） */
  records: DayRecord[] | null;
  /** 是否来自其他标签页 */
  remote: boolean;
}

type RecordsListener = (change: RecordsChange) => void;
const listeners = new Set<RecordsListener>();
const channel =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("myday-records") : null;

channel?.addEventListener("message", () => {
  listeners.forEach((listener) => listener({ records: null, remote: true }));
});

function emitChange(records: DayRecord[] | null): void {
  listeners.forEach((listener) => listener({ records, remote: false }));
  channel?.postMessage({ type: "changed" });
}

export function subscribeRecords(listener: RecordsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ------------------------------------------------------------------ */
/* IndexedDB 基础操作                                                  */
/* ------------------------------------------------------------------ */

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;

/** 复用同一个连接：既省去反复打开的开销，也保证事务按调用顺序执行。 */
function getDatabase(): Promise<IDBDatabase> {
  if (dbPromise !== null) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORD_STORE_NAME)) {
        db.createObjectStore(RECORD_STORE_NAME, { keyPath: "date" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const reset = (): void => {
        db.close();
        dbPromise = null;
      };
      db.onversionchange = reset;
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
    request.onblocked = () => {
      dbPromise = null;
      reject(new Error("IndexedDB open blocked"));
    };
  });

  return dbPromise;
}

async function readAllRecordsFromIndexedDb(): Promise<Record<string, DayRecord>> {
  const db = await getDatabase();
  const transaction = db.transaction(RECORD_STORE_NAME, "readonly");
  const rawRecords = await requestToPromise<unknown[]>(
    transaction.objectStore(RECORD_STORE_NAME).getAll(),
  );

  const records: Record<string, DayRecord> = {};
  for (const raw of rawRecords) {
    if (isPlainObject(raw) && typeof raw.date === "string") {
      const record = normalizeRecord(raw.date, raw);
      if (record !== null) {
        records[record.date] = record;
      }
    }
  }
  return records;
}

async function readRecordFromIndexedDb(date: string): Promise<DayRecord | undefined> {
  const db = await getDatabase();
  const transaction = db.transaction(RECORD_STORE_NAME, "readonly");
  const raw = await requestToPromise<unknown>(transaction.objectStore(RECORD_STORE_NAME).get(date));
  return normalizeRecord(date, raw) ?? undefined;
}

/** 读取 [from, to] 区间内日期最新的一条记录。 */
async function readLatestRecordInRange(from: string, to: string): Promise<DayRecord | undefined> {
  const db = await getDatabase();
  const transaction = db.transaction(RECORD_STORE_NAME, "readonly");
  const cursor = await requestToPromise(
    transaction.objectStore(RECORD_STORE_NAME).openCursor(IDBKeyRange.bound(from, to), "prev"),
  );
  if (cursor === null) {
    return undefined;
  }
  const raw: unknown = cursor.value;
  return normalizeRecord(String(cursor.key), raw) ?? undefined;
}

/** 写操作串行排队，避免快速连续保存时后发先至。 */
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(records: DayRecord[]): Promise<void> {
  const run = async (): Promise<void> => {
    const db = await getDatabase();
    const transaction = db.transaction(RECORD_STORE_NAME, "readwrite");
    const store = transaction.objectStore(RECORD_STORE_NAME);
    for (const record of records) {
      store.put(record);
    }
    await transactionDone(transaction);
  };

  const next = writeQueue.then(run, run);
  writeQueue = next.catch(() => undefined);
  return next;
}

/* ------------------------------------------------------------------ */
/* 旧版 localStorage 数据迁移                                          */
/* ------------------------------------------------------------------ */

let migrationPromise: Promise<void> | null = null;

function ensureLegacyDataMigrated(): Promise<void> {
  if (migrationPromise !== null) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    let raw: string | null = null;
    try {
      if (localStorage.getItem(MIGRATION_FLAG_KEY) === "1") {
        return;
      }
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    } catch {
      return;
    }

    let legacyRecords: Record<string, DayRecord> = {};
    if (raw !== null && raw !== "") {
      try {
        legacyRecords = normalizeRecords(JSON.parse(raw) as unknown);
      } catch {
        legacyRecords = {};
      }
    }

    if (Object.keys(legacyRecords).length > 0) {
      const existing = await readAllRecordsFromIndexedDb();
      const toWrite = Object.values(legacyRecords).filter((record) => !(record.date in existing));
      if (toWrite.length > 0) {
        await enqueueWrite(toWrite);
      }
    }

    try {
      localStorage.setItem(MIGRATION_FLAG_KEY, "1");
    } catch {
      // 隐私模式下 localStorage 可能不可写，下次再尝试即可
    }
  })().catch((error: unknown) => {
    migrationPromise = null;
    throw error;
  });

  return migrationPromise;
}

/* ------------------------------------------------------------------ */
/* 自动结转：把最近一天未完成的任务带到今天                            */
/* ------------------------------------------------------------------ */

function createCarryoverTask(sourceDate: string, sourceTask: Task): Task {
  return {
    id: createId(),
    title: sourceTask.title,
    completed: false,
    createdAt: new Date().toISOString(),
    carryoverFromDate: sourceTask.carryoverFromDate ?? sourceDate,
    carryoverFromTaskId: sourceTask.id,
  };
}

async function ensureTodayCarryover(today: string, stored: DayRecord | undefined): Promise<DayRecord> {
  const target = stored ?? createEmptyRecord(today);
  const previousDate = addCalendarDays(today, -1);
  const source = await readLatestRecordInRange(
    addCalendarDays(today, -CARRYOVER_LOOKBACK_DAYS),
    previousDate,
  );

  const checkedDates = target.carryoverCheckedDates ?? [];
  if (source === undefined || checkedDates.includes(source.date)) {
    return target;
  }

  // 已存在的同名未完成任务（例如提前规划过）或已结转过的任务不再重复添加
  const existingTitles = new Set(
    target.tasks.filter((task) => !task.completed).map((task) => task.title.trim()),
  );
  const existingSourceIds = new Set(
    target.tasks.map((task) => task.carryoverFromTaskId).filter(Boolean),
  );
  const carryoverTasks = source.tasks
    .filter(
      (task) =>
        !task.completed &&
        !existingSourceIds.has(task.id) &&
        !existingTitles.has(task.title.trim()),
    )
    .map((task) => createCarryoverTask(source.date, task));

  const next: DayRecord = {
    ...target,
    carryoverCheckedDates: [...checkedDates, source.date],
    tasks: [...carryoverTasks, ...target.tasks],
  };

  // 没有任何新内容又本来不存在的记录，不必落盘
  if (stored === undefined && carryoverTasks.length === 0) {
    return next;
  }

  await enqueueWrite([next]);
  if (carryoverTasks.length > 0) {
    emitChange([next]);
  }
  return next;
}

/* ------------------------------------------------------------------ */
/* 对外 API                                                            */
/* ------------------------------------------------------------------ */

export async function getAllRecords(): Promise<Record<string, DayRecord>> {
  await ensureLegacyDataMigrated();
  return readAllRecordsFromIndexedDb();
}

export async function getRecord(date: string): Promise<DayRecord> {
  await ensureLegacyDataMigrated();
  const stored = await readRecordFromIndexedDb(date);
  if (date === getTodayString()) {
    return ensureTodayCarryover(date, stored);
  }
  return stored ?? createEmptyRecord(date);
}

export async function saveRecord(record: DayRecord): Promise<void> {
  const next = { ...record, updatedAt: new Date().toISOString() };
  await enqueueWrite([next]);
  emitChange([next]);
}

export async function exportRecordsJson(): Promise<string> {
  return JSON.stringify(
    {
      app: "MyDay",
      version: 3,
      storage: "indexedDB",
      exportedAt: new Date().toISOString(),
      records: await getAllRecords(),
    },
    null,
    2,
  );
}

export interface ImportPreview {
  /** 备份中的有效记录 */
  records: Record<string, DayRecord>;
  /** 有效记录天数 */
  total: number;
  /** 其中会覆盖本地已有内容的天数 */
  conflicts: number;
}

/** 解析备份文件但不写入，便于在导入前向用户确认。 */
export async function previewImport(raw: string): Promise<ImportPreview> {
  const parsed: unknown = JSON.parse(raw) as unknown;
  const source = isPlainObject(parsed) && "records" in parsed ? parsed.records : parsed;
  const records = normalizeRecords(source);
  const total = Object.keys(records).length;
  if (total === 0) {
    throw new Error("No valid records");
  }

  const current = await getAllRecords();
  const conflicts = Object.keys(records).filter((date) => hasRecordContent(current[date])).length;
  return { records, total, conflicts };
}

export async function applyImport(preview: ImportPreview): Promise<number> {
  await enqueueWrite(Object.values(preview.records));
  emitChange(null);
  return preview.total;
}
