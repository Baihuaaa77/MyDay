import { type ChangeEvent, type FC, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportRecordsJson, importRecordsJson } from "../data/storage";

export interface DataBackupControlsProps {
  onImported: () => void;
}

const DataBackupControls: FC<DataBackupControlsProps> = ({ onImported }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleExport = (): void => {
    const blob = new Blob([exportRecordsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `myday-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("已生成备份文件。");
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
      try {
        const importedCount = importRecordsJson(String(reader.result ?? ""));
        setMessage(`已导入 ${importedCount} 天记录。`);
        onImported();
      } catch {
        setMessage("导入失败，请选择有效的 MyDay JSON 备份。");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={handleExport}>
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          导出数据
        </button>
        <button type="button" className="btn-secondary" onClick={handleImportClick}>
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
