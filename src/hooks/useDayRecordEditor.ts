import { useCallback, useEffect, useRef, useState } from "react";
import { createId, getRecord, saveRecord, subscribeRecords } from "../data/storage";
import type { DayRecord, Task } from "../types";
import { isFutureDateString } from "../utils/dateUtils";

/** 备注输入的保存防抖：连续打字时只在停顿后写一次 */
const NOTE_SAVE_DELAY = 500;

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface DeletedTask {
  task: Task;
  index: number;
}

export interface DayRecordEditor {
  /** 当前日期的记录；正在切换日期、尚未读取完成时为 null */
  record: DayRecord | null;
  loading: boolean;
  error: string | null;
  saveState: SaveState;
  addTasks: (titles: string[]) => void;
  toggleTask: (id: string) => void;
  updateTaskTitle: (id: string, title: string) => void;
  pinTask: (id: string) => void;
  reorderTasks: (activeId: string, overId: string, position: "before" | "after") => void;
  deleteTask: (id: string) => DeletedTask | null;
  restoreTask: (deleted: DeletedTask) => void;
  setRating: (rating: number | null) => void;
  setNote: (note: string) => void;
  setMood: (moodId: string | null) => void;
}

function finalizeRecord(record: DayRecord): DayRecord {
  return isFutureDateString(record.date) ? { ...record, rating: null } : record;
}

export function useDayRecordEditor(date: string | null): DayRecordEditor {
  const [record, setRecord] = useState<DayRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(date !== null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const dateRef = useRef<string | null>(date);
  const recordRef = useRef<DayRecord | null>(null);
  const loadRef = useRef<Promise<DayRecord> | null>(null);
  const pendingRef = useRef<{ record: DayRecord; timer: number } | null>(null);

  const persist = useCallback((next: DayRecord): void => {
    setSaveState("saving");
    void saveRecord(next)
      .then(() => {
        if (dateRef.current === next.date) {
          setSaveState("saved");
        }
      })
      .catch(() => {
        setSaveState("error");
        setError("保存本地数据失败，请稍后重试。");
      });
  }, []);

  const flushPending = useCallback((): void => {
    const pending = pendingRef.current;
    if (pending === null) {
      return;
    }
    window.clearTimeout(pending.timer);
    pendingRef.current = null;
    persist(pending.record);
  }, [persist]);

  const commit = useCallback(
    (next: DayRecord, debounce: boolean): void => {
      if (pendingRef.current !== null) {
        window.clearTimeout(pendingRef.current.timer);
        pendingRef.current = null;
      }
      if (!debounce) {
        persist(next);
        return;
      }
      setSaveState("saving");
      pendingRef.current = {
        record: next,
        timer: window.setTimeout(() => {
          pendingRef.current = null;
          persist(next);
        }, NOTE_SAVE_DELAY),
      };
    },
    [persist],
  );

  const load = useCallback((target: string, silent: boolean): Promise<DayRecord> => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    const promise = getRecord(target);
    loadRef.current = promise;
    promise
      .then((next) => {
        if (dateRef.current === target && loadRef.current === promise) {
          recordRef.current = next;
          setRecord(next);
        }
      })
      .catch(() => {
        if (dateRef.current === target) {
          setError("读取本地数据失败，请刷新后重试。");
        }
      })
      .finally(() => {
        if (dateRef.current === target && loadRef.current === promise) {
          setLoading(false);
        }
      });
    return promise;
  }, []);

  // 切换日期：先把上一天未落盘的修改写入，再读取新日期，避免把旧数据写进新日期
  useEffect(() => {
    flushPending();
    dateRef.current = date;
    recordRef.current = null;
    setRecord(null);
    setSaveState("idle");

    if (date === null) {
      loadRef.current = null;
      setLoading(false);
      setError(null);
      return;
    }

    void load(date, false).catch(() => undefined);
  }, [date, flushPending, load]);

  // 导入数据或其他标签页修改后，静默刷新当前日期
  useEffect(
    () =>
      subscribeRecords((change) => {
        const current = dateRef.current;
        if (current === null || pendingRef.current !== null) {
          return;
        }
        if (change.records === null) {
          void load(current, true).catch(() => undefined);
        }
      }),
    [load],
  );

  // 页面隐藏或卸载时立即写入防抖中的内容
  useEffect(() => {
    const handleHide = (): void => {
      if (document.visibilityState === "hidden") {
        flushPending();
      }
    };
    window.addEventListener("pagehide", flushPending);
    document.addEventListener("visibilitychange", handleHide);
    return () => {
      window.removeEventListener("pagehide", flushPending);
      document.removeEventListener("visibilitychange", handleHide);
      flushPending();
    };
  }, [flushPending]);

  const updateRecord = useCallback(
    (makeNext: (current: DayRecord) => DayRecord, debounce = false): void => {
      const target = dateRef.current;
      if (target === null) {
        return;
      }

      const apply = (base: DayRecord): void => {
        const current = recordRef.current?.date === target ? recordRef.current : base;
        const next = finalizeRecord(makeNext(current));
        if (next === current) {
          return;
        }
        if (dateRef.current === target) {
          recordRef.current = next;
          setRecord(next);
          commit(next, debounce);
        } else {
          persist(next);
        }
      };

      if (recordRef.current?.date === target) {
        apply(recordRef.current);
        return;
      }

      const pendingLoad = loadRef.current ?? load(target, false);
      void pendingLoad.then(apply).catch(() => {
        setError("保存本地数据失败，请稍后重试。");
      });
    },
    [commit, load, persist],
  );

  const addTasks = useCallback(
    (titles: string[]): void => {
      const cleaned = titles.map((title) => title.trim()).filter((title) => title !== "");
      if (cleaned.length === 0) {
        return;
      }
      const now = new Date().toISOString();
      updateRecord((current) => {
        const newTasks: Task[] = cleaned.map((title) => ({
          id: createId(),
          title,
          completed: false,
          createdAt: now,
        }));
        // 新任务排在已完成任务之前，保持「待办在上、已完成在下」
        const firstCompleted = current.tasks.findIndex((task) => task.completed);
        const insertAt = firstCompleted === -1 ? current.tasks.length : firstCompleted;
        const tasks = [...current.tasks];
        tasks.splice(insertAt, 0, ...newTasks);
        return { ...current, tasks };
      });
    },
    [updateRecord],
  );

  const toggleTask = useCallback(
    (id: string): void => {
      updateRecord((current) => {
        const taskIndex = current.tasks.findIndex((task) => task.id === id);
        if (taskIndex === -1) {
          return current;
        }

        const task = current.tasks[taskIndex];
        const completed = !task.completed;
        const updatedTask: Task = {
          ...task,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
        const tasks = [...current.tasks];
        tasks.splice(taskIndex, 1);

        if (completed) {
          // 完成后移到列表最后
          tasks.push(updatedTask);
        } else {
          // 取消完成后回到待办区的末尾
          const firstCompleted = tasks.findIndex((item) => item.completed);
          tasks.splice(firstCompleted === -1 ? tasks.length : firstCompleted, 0, updatedTask);
        }

        return { ...current, tasks };
      });
    },
    [updateRecord],
  );

  const updateTaskTitle = useCallback(
    (id: string, title: string): void => {
      const trimmedTitle = title.trim();
      if (trimmedTitle === "") {
        return;
      }
      updateRecord((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === id ? { ...task, title: trimmedTitle } : task)),
      }));
    },
    [updateRecord],
  );

  const reorderTasks = useCallback(
    (activeId: string, overId: string, position: "before" | "after"): void => {
      if (activeId === overId) {
        return;
      }
      updateRecord((current) => {
        const fromIndex = current.tasks.findIndex((task) => task.id === activeId);
        if (fromIndex === -1) {
          return current;
        }
        const tasks = [...current.tasks];
        const [movedTask] = tasks.splice(fromIndex, 1);
        const overIndex = tasks.findIndex((task) => task.id === overId);
        if (overIndex === -1) {
          return current;
        }
        tasks.splice(position === "before" ? overIndex : overIndex + 1, 0, movedTask);
        return { ...current, tasks };
      });
    },
    [updateRecord],
  );

  const pinTask = useCallback(
    (id: string): void => {
      updateRecord((current) => {
        const taskIndex = current.tasks.findIndex((task) => task.id === id);
        if (taskIndex <= 0) {
          return current;
        }
        const tasks = [...current.tasks];
        const [pinnedTask] = tasks.splice(taskIndex, 1);
        // 已完成的任务置顶到「已完成」分组顶部，未完成的置顶到最前
        const insertAt = pinnedTask.completed ? tasks.findIndex((task) => task.completed) : 0;
        tasks.splice(insertAt === -1 ? tasks.length : insertAt, 0, pinnedTask);
        return { ...current, tasks };
      });
    },
    [updateRecord],
  );

  const deleteTask = useCallback(
    (id: string): DeletedTask | null => {
      const current = recordRef.current;
      const index = current?.tasks.findIndex((task) => task.id === id) ?? -1;
      const deleted = current !== null && index !== -1 ? { task: current.tasks[index], index } : null;
      updateRecord((latest) => ({
        ...latest,
        tasks: latest.tasks.filter((task) => task.id !== id),
      }));
      return deleted;
    },
    [updateRecord],
  );

  const restoreTask = useCallback(
    ({ task, index }: DeletedTask): void => {
      updateRecord((current) => {
        if (current.tasks.some((item) => item.id === task.id)) {
          return current;
        }
        const tasks = [...current.tasks];
        tasks.splice(Math.min(index, tasks.length), 0, task);
        return { ...current, tasks };
      });
    },
    [updateRecord],
  );

  const setRating = useCallback(
    (rating: number | null): void => {
      if (dateRef.current === null || isFutureDateString(dateRef.current)) {
        return;
      }
      updateRecord((current) => ({ ...current, rating }));
    },
    [updateRecord],
  );

  const setNote = useCallback(
    (note: string): void => {
      updateRecord((current) => ({ ...current, note }), true);
    },
    [updateRecord],
  );

  const setMood = useCallback(
    (moodId: string | null): void => {
      updateRecord((current) => ({ ...current, moodId }));
    },
    [updateRecord],
  );

  return {
    record: record !== null && record.date === date ? record : null,
    loading,
    error,
    saveState,
    addTasks,
    toggleTask,
    updateTaskTitle,
    pinTask,
    reorderTasks,
    deleteTask,
    restoreTask,
    setRating,
    setNote,
    setMood,
  };
}
