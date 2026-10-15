import { type ChangeEvent, type FC, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { type ImportPreview, applyImport, exportRecordsJson, previewImport } from "../data/storage";
import { getTodayString } from "../utils/dateUtils";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  // Firefox 需要元素在文档中才会触发下载
  document.body.appendChild(link);
  link.click();
  link.remove();
  // 立即释放 URL 会让部分浏览器（Safari）下载失败
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** 导出 / 导入 JSON 备份；导入前先预览并确认会覆盖多少天。 */
const DataBackupControls: FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const showToast = useToast();

  const handleExport = (): void => {
    setBusy(true);
    void exportRecordsJson()
      .then((json) => {
        downloadText(`myday-backup-${getTodayString()}.json`, json);
        showToast({ message: "备份文件已生成" });
      })
      .catch(() => showToast({ message: "导出失败，请稍后重试" }))
      .finally(() => setBusy(false));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (file === undefined) {
      return;
    }

    setBusy(true);
    void file
      .text()
      .then(previewImport)
      .then(setPreview)
      .catch(() => showToast({ message: "无法读取：请选择有效的 MyDay JSON 备份" }))
      .finally(() => setBusy(false));
  };

  const handleConfirmImport = (): void => {
    if (preview === null) {
      return;
    }
    const current = preview;
    setPreview(null);
    setBusy(true);
    void applyImport(current)
      .then((count) => showToast({ message: `已导入 ${count} 天记录` }))
      .catch(() => showToast({ message: "导入失败，请稍后重试" }))
      .finally(() => setBusy(false));
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button type="button" className="btn-secondary" onClick={handleExport} disabled={busy}>
          <Download className="h-4 w-4" aria-hidden />
          导出备份
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="h-4 w-4" aria-hidden />
          导入备份
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />
      <ConfirmDialog
        open={preview !== null}
        title="导入备份"
        message={
          preview === null ? null : (
            <>
              备份中包含 <strong className="text-ink">{preview.total}</strong> 天记录。
              {preview.conflicts > 0 ? (
                <>
                  其中 <strong className="text-danger">{preview.conflicts}</strong>{" "}
                  天与本机已有内容重叠，将被备份中的版本覆盖。
                </>
              ) : (
                "不会覆盖本机已有的内容。"
              )}
            </>
          )
        }
        confirmLabel="确认导入"
        tone={preview !== null && preview.conflicts > 0 ? "danger" : "primary"}
        onConfirm={handleConfirmImport}
        onCancel={() => setPreview(null)}
      />
    </>
  );
};

export default DataBackupControls;
