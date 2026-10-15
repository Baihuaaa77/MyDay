import { type FC, type TouchEvent, Suspense, lazy, useRef } from "react";
import { BarChart3, CalendarDays, type LucideIcon, Sun } from "lucide-react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./components/BrandLogo";
import InstallPrompt from "./components/InstallPrompt";
import IntroSplash from "./components/IntroSplash";
import ThemeToggle from "./components/ThemeToggle";
import { ToastProvider } from "./components/Toast";
import HistoryPage from "./pages/HistoryPage";
import NowPage from "./pages/NowPage";

// 统计页依赖体积较大的图表库，按需加载
const StatsPage = lazy(() => import("./pages/StatsPage"));

/**
 * 根布局：桌面端顶部导航，移动端底部标签栏；移动端左右滑动切换页面。
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

const ROUTE_ORDER = NAV_ITEMS.map((item) => item.to);
const SWIPE_IGNORE_SELECTOR =
  "button, a, input, textarea, select, [role='button'], [role='radio'], [data-swipe-lock='true']";

const App: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const activeIndex = Math.max(0, ROUTE_ORDER.indexOf(location.pathname));

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>): void => {
    const target = event.target as HTMLElement | null;
    if (target?.closest(SWIPE_IGNORE_SELECTOR) || event.touches.length > 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>): void => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = event.changedTouches[0];
    if (start === null || touch === undefined || window.getSelection()?.toString()) {
      return;
    }
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const isSwipe = Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - start.time < 600;
    const nextIndex = activeIndex + (dx < 0 ? 1 : -1);
    if (isSwipe && nextIndex >= 0 && nextIndex < ROUTE_ORDER.length) {
      navigate(ROUTE_ORDER[nextIndex]);
    }
  };

  return (
    <ToastProvider>
      <div className="app-shell">
        <IntroSplash />

        <header className="app-header">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:h-16 lg:px-8">
            <BrandLogo className="shrink-0" />
            <nav className="mx-auto hidden items-center gap-1 rounded-2xl bg-surface-3/70 p-1 lg:flex" aria-label="主导航">
              {NAV_ITEMS.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} className="nav-pill">
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto lg:ml-0">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="min-w-0" style={{ touchAction: "pan-y" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <Routes>
            <Route path="/" element={<Navigate to="/now" replace />} />
            <Route path="/now" element={<NowPage />} />
            <Route path="/today" element={<Navigate to="/now" replace />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route
              path="/stats"
              element={
                <Suspense fallback={<div className="page"><div className="skeleton h-40" /></div>}>
                  <StatsPage />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/now" replace />} />
          </Routes>
        </div>

        <nav className="bottom-nav" aria-label="主导航">
          <div className="mx-auto flex max-w-md">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className="bottom-nav-link">
                <span className="bottom-nav-icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <InstallPrompt />
      </div>
    </ToastProvider>
  );
};

export default App;
