import { type FC, useEffect, useState } from "react";
import { Download, Home, MoreVertical, Plus, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISSED_UNTIL_KEY = "myday-install-prompt-dismissed-until";
/** 关闭后一周内不再打扰 */
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

type StepIcon = "menu" | "share" | "plus" | "home";

interface InstallGuide {
  title: string;
  body: string;
  steps: readonly { icon: StepIcon; text: string }[];
}

function isStandaloneDisplay(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIosSafariLike(): boolean {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  return isIos && /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function isAndroidLike(): boolean {
  return /Android/i.test(window.navigator.userAgent);
}

function isDismissed(): boolean {
  try {
    const value = Number(localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0);
    return Number.isFinite(value) && value > Date.now();
  } catch {
    return false;
  }
}

const STEP_ICONS: Record<StepIcon, typeof Home> = {
  menu: MoreVertical,
  share: Share,
  plus: Plus,
  home: Home,
};

/** 手机浏览器里提示「添加到主屏幕」；已安装或近期关闭过则不显示。 */
const InstallPrompt: FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(isDismissed);
  const [guideOpen, setGuideOpen] = useState(false);
  const [installed, setInstalled] = useState<boolean>(isStandaloneDisplay);
  const [isIos] = useState(isIosSafariLike);
  const [isAndroid] = useState(isAndroidLike);

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

  if (installed || dismissed || (installEvent === null && !isIos && !isAndroid)) {
    return null;
  }

  const handleDismiss = (): void => {
    try {
      localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DURATION));
    } catch {
      // 忽略
    }
    setDismissed(true);
  };

  const handleInstall = (): void => {
    if (installEvent === null) {
      setGuideOpen(true);
      return;
    }
    void installEvent
      .prompt()
      .then(() => installEvent.userChoice)
      .finally(() => setInstallEvent(null));
  };

  const guide: InstallGuide = isIos
    ? {
        title: "添加到 iPhone 主屏幕",
        body: "Safari 需要你手动确认一次，照着三步点就行。",
        steps: [
          { icon: "share", text: "点 Safari 工具栏里的「分享」按钮" },
          { icon: "plus", text: "在菜单里选择「添加到主屏幕」" },
          { icon: "home", text: "点右上角「添加」，以后从桌面打开" },
        ],
      }
    : {
        title: "添加到手机桌面",
        body: "如果没有自动弹窗，可以从浏览器菜单里手动添加。",
        steps: [
          { icon: "menu", text: "点浏览器右上角的菜单按钮" },
          { icon: "plus", text: "选择「安装应用」或「添加到主屏幕」" },
          { icon: "home", text: "确认后，桌面会出现 MyDay 图标" },
        ],
      };

  return (
    <>
      <aside
        className="fixed inset-x-3 z-20 flex items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-lift backdrop-blur-xl animate-slide-up lg:hidden"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        aria-label="安装 MyDay"
      >
        <img
          src={`${import.meta.env.BASE_URL}myday-icon-192-v2.png`}
          className="h-10 w-10 shrink-0 rounded-xl"
          alt=""
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">把 MyDay 放到桌面</p>
          <p className="truncate text-xs text-ink-2">像 App 一样一键打开，离线也能用</p>
        </div>
        <button type="button" className="btn-primary min-h-9 px-3" onClick={handleInstall}>
          {installEvent !== null ? <Download className="h-4 w-4" aria-hidden /> : null}
          {installEvent !== null ? "安装" : "怎么做"}
        </button>
        <button type="button" className="icon-btn" onClick={handleDismiss} aria-label="暂不安装">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </aside>

      {guideOpen ? (
        <div className="overlay lg:hidden" role="presentation" onClick={() => setGuideOpen(false)}>
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label={guide.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ink">{guide.title}</h2>
                <p className="mt-1 text-sm text-ink-2">{guide.body}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setGuideOpen(false)} aria-label="关闭">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <ol className="mt-4 grid gap-2">
              {guide.steps.map((step, index) => {
                const Icon = STEP_ICONS[step.icon];
                return (
                  <li key={step.text} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-strong shadow-sm">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-ink">
                      {index + 1}. {step.text}
                    </span>
                  </li>
                );
              })}
            </ol>
            <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setGuideOpen(false)}>
              知道了
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
};

export default InstallPrompt;
