import { useCallback, useEffect, useRef, useState } from "react";
import { getAllRecords, subscribeRecords } from "../data/storage";
import type { DayRecord } from "../types";

export interface AllRecordsState {
  records: Record<string, DayRecord>;
  loading: boolean;
  error: string | null;
}

/**
 * 读取全部记录并保持同步：本页内的保存会直接合并进来，
 * 导入或其他标签页的修改会触发整体重新读取。
 */
export function useAllRecords(): AllRecordsState {
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback((): void => {
    const requestId = ++requestIdRef.current;
    void getAllRecords()
      .then((next) => {
        if (requestId === requestIdRef.current) {
          setRecords(next);
          setError(null);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setError("读取本地数据失败，请刷新后重试。");
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeRecords((change) => {
      if (change.records === null) {
        load();
        return;
      }
      const changed = change.records;
      setRecords((prev) => {
        const next = { ...prev };
        for (const record of changed) {
          next[record.date] = record;
        }
        return next;
      });
    });
    return () => {
      requestIdRef.current += 1;
      unsubscribe();
    };
  }, [load]);

  return { records, loading, error };
}
