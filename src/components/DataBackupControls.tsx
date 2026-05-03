import { type ChangeEvent, type FC, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportRecordsJson, importRecordsJson } from "../data/storage";

export interface DataBackupControlsProps {
  onImported: () => void;
}

const DataBackupControls: FC<DataBackupControlsProps> = ({ onImported }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const handleExport = (): void => {
    setBusy(true);
    void exportRecordsJson()
      .then((json) => {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.download = `myday-backup-${date}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setMessage("已生成备份文件。");
      })
      .catch(() => {
        setMessage("导出失败，请稍后重试。");
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const handleImportClick = (): void => {
    inputRef.current?.click();
  };

  const handleImportChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBusy(true);
      void importRecordsJson(String(reader.result ?? ""))
        .then((importedCount) => {
          setMessage(`已导入 ${importedCount} 天记录。`);
          onImported();
        })
        .catch(() => {
          setMessage("导入失败，请选择有效的 MyDay JSON 备份。");
        })
        .finally(() => {
          event.target.value = "";
          setBusy(false);
        });
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button type="button" className="btn-secondary" onClick={handleExport} disabled={busy}>
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          导出数据
        </button>
        <button type="button" className="btn-secondary" onClick={handleImportClick} disabled={busy}>
          <Upload className="h-4 w-4 shrink-0" aria-hidden />
          导入数据
        </button>
      </div>
      {message !== "" && (
        <p className="text-xs font-medium text-slate-500" role="status">
          {message}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportChange}
      />
    </div>
  );
};

export default DataBackupControls;
