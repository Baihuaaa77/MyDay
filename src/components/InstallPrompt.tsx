import { type FC, useEffect, useMemo, useState } from "react";
import { Download, Home, MoreVertical, Plus, Share2, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISSED_KEY = "myday-install-prompt-dismissed";
const DISMISSED_UNTIL_KEY = "myday-install-prompt-dismissed-until";
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

type InstallGuide = {
  title: string;
  body: string;
  steps: readonly {
    icon: "menu" | "share" | "plus" | "home";
    text: string;
  }[];
};

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

function getDismissedUntil(): number {
  const rawValue = localStorage.getItem(DISMISSED_UNTIL_KEY);
  const value = rawValue === null ? 0 : Number(rawValue);
  return Number.isFinite(value) ? value : 0;
}

const InstallPrompt: FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    const legacyDismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    if (legacyDismissed) {
      localStorage.removeItem(DISMISSED_KEY);
      return false;
    }
    return getDismissedUntil() > Date.now();
  });
  const [guideOpen, setGuideOpen] = useState(false);
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
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DURATION));
    setDismissed(true);
  };

  const handleInstall = (): void => {
    if (installEvent === null) {
      setGuideOpen(true);
      return;
    }

    void installEvent.prompt().then(() => {
      void installEvent.userChoice.finally(() => {
        setInstallEvent(null);
      });
    });
  };

  const guide: InstallGuide = showIosHint
    ? {
        title: "在 iPhone 上添加到主屏幕",
        body: "Safari 需要你手动确认一次，照着这三步点就行。",
        steps: [
          { icon: "share", text: "点 Safari 底部或顶部的分享按钮。" },
          { icon: "plus", text: "在菜单里选择“添加到主屏幕”。" },
          { icon: "home", text: "点右上角“添加”，以后从桌面打开 MyDay。" },
        ],
      }
    : {
        title: "在 Android 上添加到桌面",
        body:
          installEvent !== null
            ? "这个浏览器支持直接安装，点“立即添加”会弹出系统确认。"
            : "如果没有自动弹窗，可以从浏览器菜单里手动添加。",
        steps: [
          { icon: "menu", text: "点浏览器右上角的菜单按钮。" },
          { icon: "plus", text: "选择“安装应用”或“添加到主屏幕”。" },
          { icon: "home", text: "确认后，桌面会出现 MyDay 图标。" },
        ],
      };

  const hintText =
    installEvent !== null
      ? "点一下就能弹出系统安装确认。"
      : showIosHint
        ? "打开三步指引，照着点 Safari 的系统菜单。"
        : "如果没看到安装弹窗，打开指引看浏览器菜单位置。";

  const renderStepIcon = (icon: InstallGuide["steps"][number]["icon"]): JSX.Element => {
    const className = "h-4 w-4";
    if (icon === "menu") {
      return <MoreVertical className={className} aria-hidden />;
    }
    if (icon === "share") {
      return <Share2 className={className} aria-hidden />;
    }
    if (icon === "plus") {
      return <Plus className={className} aria-hidden />;
    }
    return <Home className={className} aria-hidden />;
  };

  return (
    <>
      <aside className="mobile-install-prompt lg:hidden" aria-label="安装 MyDay">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#0b8f99]">
            {installEvent ? (
              <Download className="h-5 w-5" aria-hidden />
            ) : (
              <Smartphone className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-950">把 MyDay 放到手机桌面</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{hintText}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" className="btn-primary min-h-10 flex-1 py-2" onClick={handleInstall}>
            {installEvent ? "立即添加" : "查看步骤"}
          </button>
          {installEvent ? (
            <button
              type="button"
              className="btn-secondary min-h-10 flex-1 py-2"
              onClick={() => setGuideOpen(true)}
            >
              看步骤
            </button>
          ) : null}
          <button type="button" className="icon-button h-10 w-10" onClick={handleDismiss} aria-label="稍后提醒">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </aside>

      {guideOpen ? (
        <div className="mobile-sheet-backdrop lg:hidden" role="presentation">
          <section className="mobile-install-sheet" aria-label={guide.title}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-950">{guide.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{guide.body}</p>
              </div>
              <button type="button" className="icon-button h-10 w-10" onClick={() => setGuideOpen(false)} aria-label="关闭">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <ol className="mt-4 grid gap-2">
              {guide.steps.map((step, index) => (
                <li key={step.text} className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0b8f99] shadow-sm">
                    {renderStepIcon(step.icon)}
                  </span>
                  <span className="min-w-0 text-sm font-semibold leading-5 text-slate-700">
                    {index + 1}. {step.text}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-4 flex items-center gap-2">
              {installEvent ? (
                <button type="button" className="btn-primary min-h-10 flex-1 py-2" onClick={handleInstall}>
                  立即添加
                </button>
              ) : null}
              <button
                type="button"
                className="btn-secondary min-h-10 flex-1 py-2"
                onClick={() => setGuideOpen(false)}
              >
                知道了
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
};

export default InstallPrompt;
