import { type FC } from "react";
import { BarChart3, CalendarDays, type LucideIcon, Sun } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import BrandLogo from "./components/BrandLogo";
import InstallPrompt from "./components/InstallPrompt";
import HistoryPage from "./pages/HistoryPage";
import NowPage from "./pages/NowPage";
import StatsPage from "./pages/StatsPage";

/**
 * 根布局：顶部标签在「当下 / 历史 / 统计」间切换；具体页面由 react-router-dom 渲染。
 * 宽屏幕下导航栏左侧显示品牌名，中央为药丸式导航按钮；窄屏保持全宽标签。
 */
interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: "/now", label: "当下", Icon: Sun },
  { to: "/history", label: "历史", Icon: CalendarDays },
  { to: "/stats", label: "统计", Icon: BarChart3 },
];

const App: FC = () => {
  const desktopNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
      isActive
        ? "bg-[#10aab2] text-white shadow-[0_10px_24px_rgba(8,167,162,0.2)]"
        : "text-slate-500 hover:bg-white/70 hover:text-[#0b8f99]"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition-all duration-300 ${
      isActive
        ? "bg-[#10aab2] text-white shadow-[0_12px_28px_rgba(8,167,162,0.18)]"
        : "text-slate-500 hover:bg-slate-50 hover:text-[#0b8f99]"
    }`;

  return (
    // 全局暖灰浅底（slate-50）：让白卡片浮起，层次更清晰
    <div className="app-shell">
      {/* 毛玻璃效果导航栏：半透明白底 + 背景模糊 */}
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
          <BrandLogo className="flex shrink-0 py-2.5 lg:pr-8" compactOnMobile />
          <nav
            className="hidden flex-1 items-center justify-center gap-2 lg:flex"
            aria-label="主导航"
          >
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className={desktopNavLinkClass}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </NavLink>
            ))}
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

      <nav className="mobile-bottom-nav lg:hidden" aria-label="移动端主导航">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={mobileNavLinkClass}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <InstallPrompt />
    </div>
  );
};

export default App;
