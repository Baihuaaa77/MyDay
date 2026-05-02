import { useEffect, useState } from "react";
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
  reloadRecord: () => void;
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  setRating: (rating: number) => void;
  setNote: (note: string) => void;
  setMood: (moodId: string) => void;
}

export function useDayRecordEditor(date: string | null): DayRecordEditor {
  const [record, setRecord] = useState<DayRecord | null>(() =>
    date === null ? null : getRecord(date),
  );

  const reloadRecord = (): void => {
    setRecord(date === null ? null : getRecord(date));
  };

  useEffect(() => {
    reloadRecord();
  }, [date]);

  const updateRecord = (makeNext: (current: DayRecord) => DayRecord): void => {
    if (date === null) {
      return;
    }

    setRecord((prev) => {
      const current = prev ?? getRecord(date);
      const next = finalizeRecord(makeNext({ ...current, date }));
      saveRecord(next);
      return next;
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
    reloadRecord,
    addTask,
    toggleTask,
    deleteTask,
    setRating,
    setNote,
    setMood,
  };
}
