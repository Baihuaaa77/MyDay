import { type FC } from "react";
import { BarChart3, CalendarDays, Sun } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import BrandLogo from "./components/BrandLogo";
import HistoryPage from "./pages/HistoryPage";
import NowPage from "./pages/NowPage";
import StatsPage from "./pages/StatsPage";

/**
 * 根布局：顶部标签在「当下 / 历史 / 统计」间切换；具体页面由 react-router-dom 渲染。
 * 宽屏幕下导航栏左侧显示品牌名，中央为药丸式导航按钮；窄屏保持全宽标签。
 */
const App: FC = () => {
  // 移动端：底部边框标识激活项，三等分；桌面端(lg)：药丸形状高亮背景
  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `flex flex-1 items-center justify-center gap-2 rounded-none border-b-2 px-3 py-3.5 text-sm font-semibold transition-all duration-300 lg:flex-none lg:rounded-xl lg:border-b-0 lg:px-5 lg:py-2.5 ${
      isActive
        ? "border-teal-600 text-teal-800 lg:bg-teal-600 lg:text-white lg:shadow-[0_10px_24px_rgba(13,148,136,0.2)]"
        : "border-transparent text-slate-500 hover:text-teal-800 lg:hover:bg-white/70"
    }`;

  return (
    // 全局暖灰浅底（slate-50）：让白卡片浮起，层次更清晰
    <div className="app-shell">
      {/* 毛玻璃效果导航栏：半透明白底 + 背景模糊 */}
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/80 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
          {/* 品牌名仅在宽屏(lg)显示，使用渐变文字 */}
          <BrandLogo className="hidden shrink-0 pr-8 lg:flex" />
          <nav
            className="flex flex-1 items-center lg:justify-center lg:gap-2"
            aria-label="主导航"
          >
            <NavLink to="/now" className={navLinkClass}>
              <Sun className="h-5 w-5 shrink-0" aria-hidden />
              当下
            </NavLink>
            <NavLink to="/history" className={navLinkClass}>
              <CalendarDays className="h-5 w-5 shrink-0" aria-hidden />
              历史
            </NavLink>
            <NavLink to="/stats" className={navLinkClass}>
              <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
              统计
            </NavLink>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/now" replace />} />
        <Route path="/now" element={<NowPage />} />
        <Route path="/today" element={<Navigate to="/now" replace />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </div>
  );
};

export default App;
