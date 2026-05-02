import { useEffect, useRef, useState } from "react";
import { getRecord, saveRecord } from "../data/storage";
import type { DayRecord } from "../types";
import { isFutureDateString } from "../utils/dateUtils";

function finalizeRecord(record: DayRecord): DayRecord {
  if (isFutureDateString(record.date)) {
    return { ...record, rating: null };
  }
  return record;
}

export interface DayRecordEditor {
  record: DayRecord | null;
  loading: boolean;
  error: string | null;
  reloadRecord: () => void;
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  setRating: (rating: number) => void;
  setNote: (note: string) => void;
  setMood: (moodId: string) => void;
}

export function useDayRecordEditor(date: string | null): DayRecordEditor {
  const [record, setRecord] = useState<DayRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(date !== null);
  const [error, setError] = useState<string | null>(null);
  const recordRef = useRef<DayRecord | null>(null);

  const setCurrentRecord = (next: DayRecord | null): void => {
    recordRef.current = next;
    setRecord(next);
  };

  const reloadRecord = (): void => {
    if (date === null) {
      setCurrentRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void getRecord(date)
      .then((next) => {
        setCurrentRecord(next);
      })
      .catch(() => {
        setError("读取本地数据失败，请刷新后重试。");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;

    if (date === null) {
      setCurrentRecord(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    void getRecord(date)
      .then((next) => {
        if (!cancelled) {
          setCurrentRecord(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("读取本地数据失败，请刷新后重试。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const updateRecord = (makeNext: (current: DayRecord) => DayRecord): void => {
    if (date === null) {
      return;
    }

    void (async () => {
      const current = recordRef.current ?? (await getRecord(date));
      const next = finalizeRecord(makeNext({ ...current, date }));
      setCurrentRecord(next);
      await saveRecord(next);
    })().catch(() => {
      setError("保存本地数据失败，请稍后重试。");
    });
  };

  const addTask = (title: string): void => {
    updateRecord((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: crypto.randomUUID(),
          title,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const toggleTask = (id: string): void => {
    updateRecord((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    }));
  };

  const deleteTask = (id: string): void => {
    updateRecord((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
    }));
  };

  const setRating = (rating: number): void => {
    if (date === null || isFutureDateString(date)) {
      return;
    }
    updateRecord((current) => ({ ...current, rating }));
  };

  const setNote = (note: string): void => {
    updateRecord((current) => ({ ...current, note }));
  };

  const setMood = (moodId: string): void => {
    updateRecord((current) => ({ ...current, moodId }));
  };

  return {
    record,
    loading,
    error,
    reloadRecord,
    addTask,
    toggleTask,
    deleteTask,
    setRating,
    setNote,
    setMood,
  };
}
