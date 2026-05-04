import { type FC, useEffect, useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISSED_KEY = "myday-install-prompt-dismissed";

function isStandaloneDisplay(): boolean {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosSafariLike(): boolean {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  const isWebKit = /WebKit/.test(ua);
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isWebKit && !isOtherIosBrowser;
}

function isAndroidLike(): boolean {
  return /Android/i.test(window.navigator.userAgent);
}

const InstallPrompt: FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  });
  const [installed, setInstalled] = useState<boolean>(() => isStandaloneDisplay());

  const showIosHint = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return isIosSafariLike();
  }, []);
  const showAndroidHint = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return isAndroidLike();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = (): void => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const shouldShow =
    !installed && !dismissed && (installEvent !== null || showIosHint || showAndroidHint);

  if (!shouldShow) {
    return null;
  }

  const handleDismiss = (): void => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const handleInstall = (): void => {
    if (installEvent === null) {
      return;
    }

    void installEvent.prompt().then(() => {
      void installEvent.userChoice.finally(() => {
        setInstallEvent(null);
      });
    });
  };

  const hintText =
    installEvent !== null
      ? "安装后可像 App 一样打开；数据仍只保存在这台手机本地。"
      : showIosHint
        ? "在 Safari 中点分享按钮，再选择“添加到主屏幕”。数据仍只保存在这台手机本地。"
        : "在 Android 浏览器菜单中选择“安装应用”或“添加到主屏幕”。数据仍只保存在这台手机本地。";

  return (
    <aside className="mobile-install-prompt lg:hidden" aria-label="安装 MyDay">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#0b8f99]">
          {installEvent ? (
            <Download className="h-5 w-5" aria-hidden />
          ) : (
            <Share2 className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-950">把 MyDay 放到手机桌面</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{hintText}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {installEvent ? (
          <button type="button" className="btn-primary min-h-10 flex-1 py-2" onClick={handleInstall}>
            安装
          </button>
        ) : null}
        <button
          type="button"
          className="btn-secondary min-h-10 flex-1 py-2"
          onClick={handleDismiss}
        >
          稍后
        </button>
        <button type="button" className="icon-button h-10 w-10" onClick={handleDismiss}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
};

export default InstallPrompt;
