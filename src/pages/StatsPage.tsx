import { type FC, useMemo, useState } from "react";
import { Award, BarChart3, CircleCheck, LineChart } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAllRecords } from "../data/storage";
import {
  formatShortAxisDate,
  getDateStringsEndingTodayInclusive,
} from "../utils/dateUtils";
import { computeLongestCheckinStreak } from "../utils/statsUtils";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import DataBackupControls from "../components/DataBackupControls";

/** 可选统计区间：天数为从今天往前含今天在内的连续日历天 */
type StatsRangeId = "week" | "d30" | "halfyear" | "year";

const RANGE_OPTIONS: readonly { id: StatsRangeId; label: string; days: number }[] = [
  { id: "week", label: "近1周", days: 7 },
  { id: "d30", label: "近30日", days: 30 },
  /** 近半年：按 180 天计（约六个月） */
  { id: "halfyear", label: "近半年", days: 180 },
  /** 近一年：按 365 天计 */
  { id: "year", label: "近一年", days: 365 },
];

/** 图表中每一行对应一天的数据点 */
interface DailyChartRow {
  /** 原始日期，用于 Tooltip */
  date: string;
  /** 横轴短标签 */
  label: string;
  /** 当日评分，未评则为 null（折线断点） */
  rating: number | null;
  /** 任务完成率 0～100；无任务时为 0（柱高为 0） */
  completionRate: number;
}

/**
 * 根据数据点数量控制 X 轴刻度密度，避免近一年时标签重叠。
 */
function getXAxisInterval(pointCount: number): number {
  if (pointCount <= 10) {
    return 0;
  }
  if (pointCount <= 35) {
    return 4;
  }
  return Math.max(1, Math.floor(pointCount / 12));
}

/**
 * 统计页：可选时间范围的评分面积图、完成率柱状图，以及区间内的平均评分与完成任务数；最长连续打卡仍为全历史。
 * 宽屏(lg)下两张图表并排显示；顶部三张指标卡为「图标+标题 / 大号数值+单位 / 说明」结构。
 */
const StatsPage: FC = () => {
  const [rangeId, setRangeId] = useState<StatsRangeId>("d30");
  const [dataRevision, setDataRevision] = useState<number>(0);
  const selectedOption = RANGE_OPTIONS.find((o) => o.id === rangeId) ?? RANGE_OPTIONS[1];
  const rangeDays = selectedOption.days;
  const rangeLabel = selectedOption.label;

  const datesWindow = useMemo(
    () => getDateStringsEndingTodayInclusive(rangeDays),
    [rangeDays],
  );

  const xAxisInterval = useMemo(
    () => getXAxisInterval(datesWindow.length),
    [datesWindow.length],
  );

  /** 一次读 localStorage 并派生图表数据与汇总，避免 getAllRecords 引用每次变化导致 memo 失效 */
  const { chartRows, averageRating, totalCompletedTasks, longestStreak } =
    useMemo(() => {
      const all = getAllRecords();

      const rows: DailyChartRow[] = datesWindow.map((ds) => {
        const r = all[ds];
        const label = formatShortAxisDate(ds);
        if (r === undefined) {
          return {
            date: ds,
            label,
            rating: null,
            completionRate: 0,
          };
        }
        const total = r.tasks.length;
        const completed = r.tasks.filter((t) => t.completed).length;
        const completionRate =
          total === 0 ? 0 : Math.round((completed / total) * 100);
        return {
          date: ds,
          label,
          rating: r.rating,
          completionRate,
        };
      });

      let ratingSum = 0;
      let ratingCount = 0;
      let completedTotal = 0;

      for (const ds of datesWindow) {
        const r = all[ds];
        if (r === undefined) {
          continue;
        }
        if (r.rating !== null) {
          ratingSum += r.rating;
          ratingCount += 1;
        }
        completedTotal += r.tasks.filter((t) => t.completed).length;
      }

      const averageRating =
        ratingCount === 0
          ? null
          : Math.round((ratingSum / ratingCount) * 10) / 10;

      return {
        chartRows: rows,
        averageRating,
        totalCompletedTasks: completedTotal,
        longestStreak: computeLongestCheckinStreak(all),
      };
    }, [datesWindow, dataRevision]);

  /** Recharts Tooltip 统一样式（边框与页面卡片一致，偏浅） */
  const tooltipStyle = {
    borderRadius: "1rem",
    border: "1px solid #e2e8f0",
    fontSize: "12px",
    boxShadow: "0 18px 45px rgb(15 23 42 / 0.12)",
  };

  /** 评分面积图下方渐变填充：与折线同色、上实下透明（SVG linearGradient，非 Tailwind 任意值） */
  const ratingAreaGradientId = "statsRatingAreaGradient";

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <BarChart3 className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="eyebrow">Performance view</p>
              <h1 className="page-title">数据统计</h1>
            </div>
          </div>
          <QuoteOfTheDay variant="stats" className="mt-3 max-w-3xl" />
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
          {/* 时间范围选择器：白底药丸按钮 */}
          <div
            className="control-shell flex flex-wrap gap-1"
            role="group"
            aria-label="统计时间范围"
          >
            {RANGE_OPTIONS.map((opt) => {
              const isActive = rangeId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRangeId(opt.id)}
                  className={`segmented-button ${
                    isActive
                      ? "segmented-button-active"
                      : "segmented-button-idle"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <DataBackupControls onImported={() => setDataRevision((prev) => prev + 1)} />
        </div>
      </header>

      {/* 三张指标卡：参考仪表盘样式——首行图标盒+标题，主数字深色、单位浅色同基线，末行说明小字 */}
      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50"
              aria-hidden
            >
              <LineChart className="h-5 w-5 text-teal-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600">平均评分</p>
          </div>
          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold text-slate-950">
              {averageRating === null ? "—" : String(averageRating)}
            </span>
            {averageRating !== null ? (
              <span className="text-lg font-medium text-slate-400">分</span>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-slate-400">{rangeLabel}内有评分的日期</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50"
              aria-hidden
            >
              <CircleCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600">完成任务总数</p>
          </div>
          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold text-slate-950">
              {totalCompletedTasks}
            </span>
            <span className="text-lg font-medium text-slate-400">项</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">{rangeLabel}累计勾选完成</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50"
              aria-hidden
            >
              <Award className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600">最长连续打卡</p>
          </div>
          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold text-slate-950">
              {longestStreak}
            </span>
            <span className="text-lg font-medium text-slate-400">天</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">有任务 / 评分 / 备注即算打卡</p>
        </div>
      </section>

      {/* 宽屏双列图表：评分折线 + 完成率柱状图 */}
      <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-6">
        <section className="panel panel-interactive">
          <h2 className="section-title">
            {rangeLabel} · 每日评分趋势
          </h2>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={ratingAreaGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.36} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* 仅水平虚线网格，浅色与需求文档一致 */}
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  interval={xAxisInterval}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  width={28}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => {
                    if (value == null || value === "") {
                      return ["无评分", "评分"];
                    }
                    return [`${String(value)} 分`, "评分"];
                  }}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as DailyChartRow | undefined;
                    return row ? `日期 ${row.date}` : "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rating"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill={`url(#${ratingAreaGradientId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: "#0f766e", stroke: "#fff", strokeWidth: 2 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel panel-interactive">
          <h2 className="section-title">
            {rangeLabel} · 每日任务完成率
          </h2>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  interval={xAxisInterval}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  width={32}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${String(value)}%`, "完成率"]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as DailyChartRow | undefined;
                    return row ? `日期 ${row.date}` : "";
                  }}
                />
                {/* 柱状图与主色统一，避免高饱和绿 */}
                <Bar dataKey="completionRate" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </main>
  );
};

export default StatsPage;
