import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Clock,
  GraduationCap,
  Minus,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GlassButton, GlassCard } from '../components/GlassPrimitives';
import { useAcademic } from '../context/AcademicContext';
import {
  buildCohortTimelineSeries,
  computeDashboardKPIs,
  computeSubjectSummaries,
} from '../utils/analytics';

interface ChartTooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

const GlassChartTooltip: React.FC<{
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-sidebar rounded-xl px-3.5 py-2.5 text-xs shadow-xl border border-white/20">
      <p className="font-display font-semibold text-white mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="text-slate-300">{entry.name}</span>
            <span className="font-mono-tabular font-semibold text-cyan-200">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const {
    students,
    marks,
    activities,
    analysesCount,
    settings,
    setActivePage,
    navigateToAddStudent,
    setSelectedSubjectName,
  } = useAcademic();

  const [chartMetric, setChartMetric] = useState<'both' | 'average' | 'peak'>('both');

  const kpis = useMemo(
    () => computeDashboardKPIs(students, marks, analysesCount),
    [students, marks, analysesCount]
  );

  const subjectSummaries = useMemo(() => computeSubjectSummaries(marks), [marks]);

  const timelineSeries = useMemo(() => buildCohortTimelineSeries(marks), [marks]);

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const hasStudents = students.length > 0;
  const hasMarks = kpis.completedAssessments > 0;

  return (
    <div className="space-y-7">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-cyan-300/90 tracking-wide mb-1.5">
            {settings.institutionName} · {settings.academicTerm}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
            Academic Performance Overview
          </h1>
          <p className="mt-1.5 text-sm text-slate-300 max-w-2xl">
            Add students, enter assessment marks, and estimate missing evaluations using Lagrange numerical interpolation.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <GlassButton variant="secondary" onClick={navigateToAddStudent}>
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </GlassButton>
          <GlassButton variant="primary" onClick={() => setActivePage('interpolation')}>
            <Calculator className="w-4 h-4" />
            <span>Open Calculator</span>
          </GlassButton>
        </div>
      </div>

      {/* 4 Primary KPI Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <GlassCard interactive className="p-0">
          <button
            type="button"
            onClick={() => setActivePage('students')}
            className="w-full h-full p-5 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">Total Students</p>
                <p className="mt-2 font-display font-mono-tabular text-3xl font-bold text-white">
                  {kpis.totalStudents}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-300">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-300">
              {hasStudents
                ? `${kpis.completedAssessments} recorded · ${kpis.missingAssessments} pending`
                : 'No students added yet'}
            </p>
          </button>
        </GlassCard>

        <GlassCard interactive className="p-0">
          <button
            type="button"
            onClick={() => setActivePage('interpolation')}
            className="w-full h-full p-5 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">Analyses Run</p>
                <p className="mt-2 font-display font-mono-tabular text-3xl font-bold text-white">
                  {kpis.analysesCount}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-300/25 bg-indigo-400/10 text-indigo-300">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-300">
              {kpis.subjectsCount > 0
                ? `${kpis.subjectsCount} active subject${kpis.subjectsCount === 1 ? '' : 's'} tracked`
                : 'Interpolation estimates completed'}
            </p>
          </button>
        </GlassCard>

        <GlassCard interactive className="p-0">
          <button
            type="button"
            onClick={() => setActivePage('reports')}
            className="w-full h-full p-5 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">Average Marks</p>
                <p className="mt-2 font-display font-mono-tabular text-3xl font-bold text-white">
                  {kpis.averageMarks !== null ? `${kpis.averageMarks.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/25 bg-sky-400/10 text-sky-300">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-300">
              {kpis.averageMarks !== null
                ? `Passing benchmark ${settings.passingPercentage}% · Recorded mean`
                : 'Awaiting assessment marks'}
            </p>
          </button>
        </GlassCard>

        <GlassCard interactive className="p-0">
          <button
            type="button"
            onClick={() => setActivePage('analysis')}
            className="w-full h-full p-5 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">Performance Trend</p>
                <p className="mt-2 font-display font-mono-tabular text-3xl font-bold text-white">
                  {kpis.trendDelta !== null
                    ? kpis.trendDelta > 0
                      ? `+${kpis.trendDelta.toFixed(1)}%`
                      : `${kpis.trendDelta.toFixed(1)}%`
                    : '—'}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  kpis.trendDirection === 'up'
                    ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-300'
                    : kpis.trendDirection === 'down'
                      ? 'border-rose-300/25 bg-rose-400/10 text-rose-300'
                      : 'border-white/15 bg-white/[0.05] text-slate-300'
                }`}
              >
                {kpis.trendDirection === 'up' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : kpis.trendDirection === 'down' ? (
                  <ArrowDownRight className="w-5 h-5" />
                ) : (
                  <Minus className="w-5 h-5" />
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
              <span>
                {kpis.trendDirection === 'up'
                  ? 'Upward momentum across assessments'
                  : kpis.trendDirection === 'down'
                    ? 'Slight dip in recent assessments'
                    : kpis.trendDirection === 'flat'
                      ? 'Steady score progression'
                      : 'Needs 2+ recorded marks'}
              </span>
            </p>
          </button>
        </GlassCard>
      </div>

      {/* Empty Getting-Started Guidance Banner when 0 students */}
      {!hasStudents && (
        <GlassCard className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300 mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-semibold text-white">
            No students added yet. Add your first student.
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-lg mx-auto">
            Start by adding a student with their name and register number, then record assessment marks to unlock numerical interpolation and performance trend graphs.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <GlassButton variant="primary" onClick={navigateToAddStudent}>
              <UserPlus className="w-4 h-4" />
              <span>Add First Student</span>
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Main Analytics Split: Interactive Chart + Subject Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <GlassCard className="xl:col-span-8 p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Interactive Marks Trajectory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mean and peak assessment progression across recorded evaluations
              </p>
            </div>
            {hasMarks && (
              <div
                role="group"
                aria-label="Chart series filter"
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] p-1 self-start"
              >
                {(
                  [
                    { id: 'both', label: 'Combined' },
                    { id: 'average', label: 'Mean' },
                    { id: 'peak', label: 'Peak' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setChartMetric(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      chartMetric === tab.id
                        ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-300/35'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-[280px] w-full">
            {timelineSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineSeries}
                  margin={{ top: 10, right: 44, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dashAvgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="dashPeakFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="assessment"
                    interval={0}
                    padding={{ left: 10, right: 18 }}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<GlassChartTooltip />} />
                  {(chartMetric === 'both' || chartMetric === 'peak') && (
                    <Area
                      type="monotone"
                      dataKey="topScore"
                      name="Peak Score"
                      stroke="#A78BFA"
                      strokeWidth={2.2}
                      fill="url(#dashPeakFill)"
                      animationDuration={350}
                      activeDot={{ r: 5, fill: '#C4B5FD', stroke: '#040814', strokeWidth: 2 }}
                    />
                  )}
                  {(chartMetric === 'both' || chartMetric === 'average') && (
                    <Area
                      type="monotone"
                      dataKey="averageScore"
                      name="Mean Score"
                      stroke="#38BDF8"
                      strokeWidth={2.6}
                      fill="url(#dashAvgFill)"
                      animationDuration={350}
                      activeDot={{ r: 5, fill: '#67E8F9', stroke: '#040814', strokeWidth: 2 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm font-medium text-slate-200">
                  No assessment marks recorded yet
                </p>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  {hasStudents
                    ? 'Enter assessment scores in Marks Entry to visualize your student trajectory chart.'
                    : 'Add a student first, then enter assessment marks to populate this performance graph.'}
                </p>
                <GlassButton
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => (hasStudents ? setActivePage('marks') : navigateToAddStudent())}
                >
                  {hasStudents ? 'Enter Assessment Marks' : 'Add First Student'}
                </GlassButton>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Subject Overview */}
        <GlassCard className="xl:col-span-4 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="font-display text-lg font-semibold text-white">
                Subject Overview
              </h2>
              {subjectSummaries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActivePage('analysis')}
                  className="text-xs font-medium text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {subjectSummaries.length > 0 ? (
              <div className="divide-y divide-white/[0.08]">
                {subjectSummaries.map((sub) => (
                  <div
                    key={sub.subjectName}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubjectName(sub.subjectName);
                          setActivePage('analysis');
                        }}
                        className="text-left group"
                      >
                        <span className="block text-sm font-medium text-slate-100 group-hover:text-cyan-200 transition-colors">
                          {sub.subjectName}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {sub.assessmentCount} marks
                          {sub.missingCount > 0 ? ` · ${sub.missingCount} missing` : ''}
                        </span>
                      </button>
                      <span className="font-mono-tabular text-sm font-semibold text-cyan-200">
                        {sub.averageScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 transition-[width] duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, sub.averageScore))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-300">No subjects analyzed yet.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Subject averages will appear automatically once marks are saved.
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Recent Activities (only real user actions, clean empty state when none) */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Actions recorded during your session
            </p>
          </div>
          {activities.length > 0 && (
            <GlassButton size="sm" variant="ghost" onClick={() => setActivePage('reports')}>
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </GlassButton>
          )}
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-white/[0.07]">
            {activities.slice(0, 6).map((act) => (
              <div
                key={act.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">{act.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{act.detail}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono-tabular text-slate-400 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatRelativeTime(act.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            No activity recorded yet. Start by adding a student.
          </p>
        )}
      </GlassCard>
    </div>
  );
};
