import { type FC, useEffect, useState } from "react";

const SPLASH_DURATION = 1500;
const SESSION_KEY = "myday-splash-shown";

function shouldShowSplash(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      return false;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage 不可用时照常显示
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// 模块加载时只判断一次，避免 StrictMode 下初始化函数被调用两次
const SHOW_ON_LOAD = shouldShowSplash();

/** 启动动画：每个会话只播放一次，点击可跳过。 */
const IntroSplash: FC = () => {
  const [visible, setVisible] = useState<boolean>(SHOW_ON_LOAD);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setTimeout(() => setVisible(false), SPLASH_DURATION);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="intro-splash" aria-hidden onClick={() => setVisible(false)}>
      <img
        className="intro-logo"
        src={`${import.meta.env.BASE_URL}myday-icon-512-v2.png`}
        alt=""
      />
      <div className="intro-copy">
        <p className="text-4xl font-extrabold tracking-tight text-ink">MyDay</p>
        <p className="mt-2 text-base font-medium text-ink-2">专属于你的每一天</p>
      </div>
    </div>
  );
};

export default IntroSplash;
