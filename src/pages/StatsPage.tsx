import { type FC, type ReactNode, useMemo, useState } from "react";
import { CalendarCheck, CircleCheckBig, DatabaseBackup, Flame, Star } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import DataBackupControls from "../components/DataBackupControls";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import { MOOD_OPTIONS } from "../data/moods";
import { hasRecordContent } from "../data/storage";
import { useAllRecords } from "../hooks/useAllRecords";
import { useResolvedTheme } from "../hooks/useTheme";
import { useToday } from "../hooks/useToday";
import type { DayRecord } from "../types";
import {
  formatMonthDay,
  formatShortAxisDate,
  getDateStringsEnding,
  parseDateString,
} from "../utils/dateUtils";
import {
  computeCurrentCheckinStreak,
  computeLongestCheckinStreak,
  countCompleted,
} from "../utils/statsUtils";

type RangeId = "week" | "month" | "halfyear" | "year";

const RANGE_OPTIONS: readonly { id: RangeId; label: string; days: number }[] = [
  { id: "week", label: "7 天", days: 7 },
  { id: "month", label: "30 天", days: 30 },
  { id: "halfyear", label: "半年", days: 182 },
  { id: "year", label: "一年", days: 365 },
];

/** 超过这个天数时按周汇总，避免几百根细柱挤在一起 */
const WEEKLY_BUCKET_THRESHOLD = 60;
const WEEKDAY_LABELS: readonly string[] = ["一", "二", "三", "四", "五", "六", "日"];

interface ChartRow {
  key: string;
  label: string;
  tooltipLabel: string;
  rating: number | null;
  completion: number | null;
  completed: number;
  total: number;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function buildRows(records: Record<string, DayRecord>, dates: string[], bucketSize: number): ChartRow[] {
  const rows: ChartRow[] = [];
  // 从最新一天往回切桶，保证最后一个桶以今天结尾
  for (let end = dates.length; end > 0; end -= bucketSize) {
    const bucket = dates.slice(Math.max(0, end - bucketSize), end);
    const ratings: number[] = [];
    let completed = 0;
    let total = 0;
    for (const date of bucket) {
      const record = records[date];
      if (record === undefined) {
        continue;
      }
      if (record.rating !== null) {
        ratings.push(record.rating);
      }
      completed += countCompleted(record);
      total += record.tasks.length;
    }
    const first = bucket[0];
    const last = bucket[bucket.length - 1];
    rows.unshift({
      key: first,
      label: formatShortAxisDate(first),
      tooltipLabel:
        bucket.length === 1 ? formatMonthDay(first) : `${formatMonthDay(first, false)} – ${formatMonthDay(last, false)}`,
      rating: average(ratings),
      completion: total === 0 ? null : Math.round((completed / total) * 100),
      completed,
      total,
    });
  }
  return rows;
}

function useChartColors(): { brand: string; grid: string; tick: string; cursor: string } {
  const theme = useResolvedTheme();
  return theme === "dark"
    ? { brand: "#26c4c6", grid: "#273441", tick: "#667687", cursor: "#3a4a5a" }
    : { brand: "#10aab2", grid: "#e2e8ee", tick: "#94a0b0", cursor: "#cbd5de" };
}

const ChartTooltip: FC<TooltipProps<number, string> & { kind: "rating" | "completion" }> = ({
  active,
  payload,
  kind,
}) => {
  const row = payload?.[0]?.payload as ChartRow | undefined;
  if (active !== true || row === undefined) {
    return null;
  }
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lift">
      <p className="font-semibold text-ink">{row.tooltipLabel}</p>
      <p className="mt-1 text-ink-2">
        {kind === "rating"
          ? row.rating === null
            ? "没有评分"
            : `平均 ${row.rating} 分`
          : row.completion === null
            ? "没有任务"
            : `完成 ${row.completed}/${row.total} · ${row.completion}%`}
      </p>
    </div>
  );
};

const MetricTile: FC<{
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  hint: string;
}> = ({ icon, label, value, unit, hint }) => (
  <div className="card p-4">
    <div className="flex items-center gap-2 text-sm font-semibold text-ink-2">
      {icon}
      {label}
    </div>
    <p className="mt-3 flex items-baseline gap-1">
      <span className="tabular text-[1.75rem] font-bold leading-none text-ink sm:text-3xl">{value}</span>
      {unit !== undefined ? <span className="text-sm font-semibold text-ink-3">{unit}</span> : null}
    </p>
    <p className="mt-2 truncate text-xs text-ink-3">{hint}</p>
  </div>
);

const ChartCard: FC<{ title: string; subtitle: string; children: ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <section className="card">
    <h2 className="text-base font-bold text-ink">{title}</h2>
    <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>
    <div className="mt-4 h-56 w-full sm:h-64">{children}</div>
  </section>
);

/** 带数值标签的横向条形，用于状态分布与一周节奏 */
const BarRow: FC<{ label: ReactNode; value: number; max: number; display: string }> = ({
  label,
  value,
  max,
  display,
}) => (
  <li className="flex items-center gap-3">
    <span className="flex w-16 shrink-0 items-center gap-1.5 text-sm text-ink-2">{label}</span>
    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
      <span
        className="block h-full rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${max === 0 ? 0 : Math.max(value > 0 ? 4 : 0, (value / max) * 100)}%` }}
      />
    </span>
    <span className="tabular w-12 shrink-0 text-right text-sm font-semibold text-ink">{display}</span>
  </li>
);

const StatsPage: FC = () => {
  const today = useToday();
  const [rangeId, setRangeId] = useState<RangeId>("month");
  const { records, loading, error } = useAllRecords();
  const colors = useChartColors();
  const range = RANGE_OPTIONS.find((option) => option.id === rangeId) ?? RANGE_OPTIONS[1];
  const bucketSize = range.days > WEEKLY_BUCKET_THRESHOLD ? 7 : 1;

  const stats = useMemo(() => {
    const dates = getDateStringsEnding(today, range.days);
    const inRange = dates.map((date) => records[date]).filter((record): record is DayRecord =>
      hasRecordContent(record),
    );

    const ratings = inRange.flatMap((record) => (record.rating === null ? [] : [record.rating]));
    const completed = inRange.reduce((sum, record) => sum + countCompleted(record), 0);
    const total = inRange.reduce((sum, record) => sum + record.tasks.length, 0);

    const moodCounts = MOOD_OPTIONS.map((mood) => ({
      mood,
      count: inRange.filter((record) => record.moodId === mood.id).length,
    }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const weekdayRatings: number[][] = WEEKDAY_LABELS.map(() => []);
    for (const record of inRange) {
      const date = parseDateString(record.date);
      if (date !== null && record.rating !== null) {
        weekdayRatings[(date.getDay() + 6) % 7].push(record.rating);
      }
    }

    const rows = buildRows(records, dates, bucketSize);

    return {
      rows,
      ratedRows: rows.filter((row) => row.rating !== null).length,
      averageRating: average(ratings),
      ratedDays: ratings.length,
      completed,
      total,
      completionRate: total === 0 ? null : Math.round((completed / total) * 100),
      recordedDays: inRange.length,
      currentStreak: computeCurrentCheckinStreak(records, today),
      longestStreak: computeLongestCheckinStreak(records),
      moodCounts,
      weekdayAverages: weekdayRatings.map(average),
    };
  }, [bucketSize, range.days, records, today]);

  const xInterval = stats.rows.length <= 10 ? 0 : Math.ceil(stats.rows.length / 8) - 1;
  const bucketHint = bucketSize === 7 ? "按周汇总" : "按日";
  const bestWeekday = Math.max(...stats.weekdayAverages.map((value) => value ?? 0));
  const hasData = stats.recordedDays > 0;

  return (
    <main className="page page-enter">
      <header className="mb-5 flex flex-col gap-4 lg:mb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">洞察</p>
          <h1 className="mt-1.5 text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-[2rem]">
            数据统计
          </h1>
          <QuoteOfTheDay variant="stats" date={today} className="mt-2 max-w-2xl" />
        </div>
        <div className="segmented w-full shrink-0 lg:w-80" role="group" aria-label="统计时间范围">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={rangeId === option.id}
              className="segmented-item"
              onClick={() => setRangeId(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {error !== null ? (
        <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="关键指标">
        <MetricTile
          icon={<Star className="h-4 w-4 text-warm" aria-hidden />}
          label="平均评分"
          value={stats.averageRating ?? "–"}
          unit={stats.averageRating === null ? undefined : "/ 10"}
          hint={stats.ratedDays > 0 ? `${stats.ratedDays} 天有评分` : "这段时间还没有评分"}
        />
        <MetricTile
          icon={<CircleCheckBig className="h-4 w-4 text-brand" aria-hidden />}
          label="完成率"
          value={stats.completionRate ?? "–"}
          unit={stats.completionRate === null ? undefined : "%"}
          hint={stats.total > 0 ? `完成 ${stats.completed} / ${stats.total} 项` : "这段时间还没有任务"}
        />
        <MetricTile
          icon={<Flame className="h-4 w-4 text-warm" aria-hidden />}
          label="连续记录"
          value={stats.currentStreak}
          unit="天"
          hint={`历史最长 ${stats.longestStreak} 天`}
        />
        <MetricTile
          icon={<CalendarCheck className="h-4 w-4 text-brand" aria-hidden />}
          label="记录天数"
          value={stats.recordedDays}
          unit={`/ ${range.days}`}
          hint={`近 ${range.label}内留下记录的天数`}
        />
      </section>

      {!hasData && !loading ? (
        <section className="card mt-4 flex flex-col items-center gap-2 py-10 text-center">
          <span className="text-4xl" aria-hidden>
            📊
          </span>
          <p className="font-semibold text-ink">这段时间还没有数据</p>
          <p className="max-w-sm text-sm text-ink-2">
            在「当下」页记录任务、状态和评分，图表会随着你的每一天慢慢长出来。
          </p>
        </section>
      ) : (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="评分趋势" subtitle={`近 ${range.label} · ${bucketHint} · 满分 10`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.rows} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.brand} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={colors.brand} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={colors.grid} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: colors.tick }}
                    tickLine={false}
                    axisLine={false}
                    interval={xInterval}
                    minTickGap={8}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 5, 10]}
                    tick={{ fontSize: 11, fill: colors.tick }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip kind="rating" />}
                    cursor={{ stroke: colors.cursor, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    stroke={colors.brand}
                    strokeWidth={2}
                    fill="url(#ratingFill)"
                    connectNulls
                    dot={stats.ratedRows < 3 ? { r: 4, fill: colors.brand, strokeWidth: 0 } : false}
                    activeDot={{ r: 5, fill: colors.brand, stroke: "rgb(var(--surface))", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="任务完成率" subtitle={`近 ${range.label} · ${bucketHint} · 没有任务的日子留空`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.rows} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={colors.grid} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: colors.tick }}
                    tickLine={false}
                    axisLine={false}
                    interval={xInterval}
                    minTickGap={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 50, 100]}
                    tick={{ fontSize: 11, fill: colors.tick }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => `${value}%`}
                  />
                  <Tooltip
                    content={<ChartTooltip kind="completion" />}
                    cursor={{ fill: colors.grid, opacity: 0.5 }}
                  />
                  <Bar
                    dataKey="completion"
                    fill={colors.brand}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="card">
              <h2 className="text-base font-bold text-ink">状态分布</h2>
              <p className="mt-0.5 text-xs text-ink-3">近 {range.label}每天选择的状态</p>
              {stats.moodCounts.length === 0 ? (
                <p className="mt-6 text-center text-sm text-ink-3">还没有记录过状态</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {stats.moodCounts.map(({ mood, count }) => (
                    <BarRow
                      key={mood.id}
                      label={
                        <>
                          <span className="text-lg leading-none" aria-hidden>
                            {mood.emoji}
                          </span>
                          {mood.label}
                        </>
                      }
                      value={count}
                      max={stats.moodCounts[0].count}
                      display={`${count} 天`}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2 className="text-base font-bold text-ink">一周节奏</h2>
              <p className="mt-0.5 text-xs text-ink-3">近 {range.label}每个星期几的平均评分</p>
              {stats.ratedDays === 0 ? (
                <p className="mt-6 text-center text-sm text-ink-3">评分后就能看到你一周中的高低起伏</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2.5">
                  {stats.weekdayAverages.map((value, index) => (
                    <BarRow
                      key={WEEKDAY_LABELS[index]}
                      label={
                        <>
                          周{WEEKDAY_LABELS[index]}
                          {value !== null && value === bestWeekday ? (
                            <span className="text-xs" title="评分最高" aria-label="评分最高">
                              ⭐
                            </span>
                          ) : null}
                        </>
                      }
                      value={value ?? 0}
                      max={10}
                      display={value === null ? "–" : String(value)}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <section className="card mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="card-title-icon">
            <DatabaseBackup className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink">数据备份</h2>
            <p className="mt-1 text-sm text-ink-2">
              数据只保存在这台设备的浏览器里。定期导出 JSON 备份，也可用它在设备间迁移。
            </p>
          </div>
        </div>
        <DataBackupControls />
      </section>
    </main>
  );
};

export default StatsPage;
