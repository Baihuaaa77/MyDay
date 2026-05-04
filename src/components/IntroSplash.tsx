import { type FC, useEffect, useState } from "react";

const SPLASH_DURATION = 3000;

const IntroSplash: FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), SPLASH_DURATION);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <section className="intro-splash" aria-label="MyDay 启动动画">
      <div className="intro-splash-mark" aria-hidden />
      <div className="intro-splash-content">
        <div className="intro-logo-wrap">
          <img
            className="intro-logo"
            src={`${import.meta.env.BASE_URL}myday-icon-1024.png`}
            alt=""
            aria-hidden
          />
        </div>
        <div className="intro-copy">
          <p className="intro-brand">MyDay</p>
          <p className="intro-tagline">专属于你的每一天</p>
        </div>
      </div>
      <div className="intro-progress" aria-hidden />
    </section>
  );
};

export default IntroSplash;


