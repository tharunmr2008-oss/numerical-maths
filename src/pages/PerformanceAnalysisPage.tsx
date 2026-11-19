import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FloatingSelect,
  GlassButton,
  GlassCard,
} from '../components/GlassPrimitives';
import { useAcademic } from '../context/AcademicContext';
import { InterpolationMethod } from '../types/academic';
import {
  buildPerformanceSeries,
  computeSubjectSummaries,
} from '../utils/analytics';
import { METHOD_METADATA } from '../utils/interpolation';

interface AnalysisTooltipItem {
  name: string;
  value: number;
  dataKey: string;
}

const AnalysisTooltip: React.FC<{
  active?: boolean;
  payload?: AnalysisTooltipItem[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-sidebar rounded-xl px-3.5 py-2.5 text-xs shadow-xl border border-white/20">
      <p className="font-display font-semibold text-white mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-5">
            <span className="text-slate-300">{entry.name}</span>
            <span
              className={`font-mono-tabular font-semibold ${
                entry.dataKey === 'actual' ? 'text-cyan-300' : 'text-violet-300'
              }`}
            >
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PerformanceAnalysisPage: React.FC = () => {
  const {
    students,
    marks,
    settings,
    selectedStudentId,
    setSelectedStudentId,
    selectedSubjectName,
    setSelectedSubjectName,
    setActivePage,
    navigateToAddStudent,
  } = useAcademic();

  const [method, setMethod] = useState<InterpolationMethod>(settings.defaultMethod);
  const [showActual, setShowActual] = useState(true);
  const [showEstimated, setShowEstimated] = useState(true);

  const currentStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? students[0],
    [students, selectedStudentId]
  );

  const studentSubjects = useMemo(() => {
    if (!currentStudent) return [];
    const set = new Set<string>();
    for (const m of marks) {
      if (m.studentId === currentStudent.id && m.subjectName.trim()) {
        set.add(m.subjectName.trim());
      }
    }
    if (currentStudent.subjectName.trim()) {
      set.add(currentStudent.subjectName.trim());
    }
    if (set.size === 0) set.add('General');
    return Array.from(set);
  }, [currentStudent, marks]);

  const effectiveSubjectName = useMemo(() => {
    if (
      selectedSubjectName &&
      studentSubjects.some(
        (s) => s.toLowerCase() === selectedSubjectName.trim().toLowerCase()
      )
    ) {
      return (
        studentSubjects.find(
          (s) => s.toLowerCase() === selectedSubjectName.trim().toLowerCase()
        ) ?? studentSubjects[0]
      );
    }
    return studentSubjects[0] ?? 'General';
  }, [studentSubjects, selectedSubjectName]);

  const { series, slopePerAssessment, actualAverage, estimatedOverall } = useMemo(() => {
    if (!currentStudent) {
      return {
        series: [],
        slopePerAssessment: 0,
        actualAverage: null,
        estimatedOverall: null,
      };
    }
    return buildPerformanceSeries(
      marks,
      currentStudent.id,
      effectiveSubjectName,
      method
    );
  }, [marks, currentStudent, effectiveSubjectName, method]);

  const subjectSummaries = useMemo(() => computeSubjectSummaries(marks), [marks]);

  const trendLabel =
    slopePerAssessment > 0.35
      ? 'Positive acceleration'
      : slopePerAssessment < -0.35
        ? 'Declining trajectory'
        : 'Steady trajectory';

  if (!currentStudent) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-cyan-300/90 mb-1">
            Step 4 · Visual Telemetry
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Performance Analysis
          </h1>
        </div>
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-slate-200">
            No students added yet. Add a student and enter marks to view performance graphs.
          </p>
          <GlassButton className="mt-4" onClick={navigateToAddStudent}>
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-cyan-300/90 mb-1">
          Step 4 · Visual Telemetry
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          Performance Analysis
        </h1>
        <p className="mt-1 text-sm text-slate-300 max-w-2xl">
          Compare recorded assessment marks against interpolated trend projections and examine subject-level distributions.
        </p>
      </div>

      {/* Filters */}
      <GlassCard className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FloatingSelect
            id="analysis-student"
            label="Student"
            value={currentStudent.id}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.map((stu) => (
              <option key={stu.id} value={stu.id} className="bg-[#09132c] text-slate-100">
                {stu.name} ({stu.registerNumber})
              </option>
            ))}
          </FloatingSelect>

          <FloatingSelect
            id="analysis-subject"
            label="Subject"
            value={effectiveSubjectName}
            onChange={(e) => setSelectedSubjectName(e.target.value)}
          >
            {studentSubjects.map((sub) => (
              <option key={sub} value={sub} className="bg-[#09132c] text-slate-100">
                {sub}
              </option>
            ))}
          </FloatingSelect>

          <FloatingSelect
            id="analysis-method"
            label="Interpolation Model"
            value={method}
            onChange={(e) => setMethod(e.target.value as InterpolationMethod)}
          >
            {(Object.keys(METHOD_METADATA) as InterpolationMethod[]).map((m) => (
              <option key={m} value={m} className="bg-[#09132c] text-slate-100">
                {METHOD_METADATA[m].name}
              </option>
            ))}
          </FloatingSelect>
        </div>
      </GlassCard>

      {/* Performance Trend Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <GlassCard interactive className="p-5">
          <p className="text-xs font-medium text-slate-400">Actual Recorded Average</p>
          <p className="mt-2 font-display font-mono-tabular text-3xl font-bold text-cyan-200">
            {actualAverage !== null ? `${actualAverage.toFixed(1)}%` : '—'}
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Observed mean across completed evaluations
          </p>
        </GlassCard>

        <GlassCard interactive className="p-5">
          <p className="text-xs font-medium text-slate-400">Interpolated Overall Mean</p>
          <p className="mt-2 font-display font-mono-tabular text-3xl font-bold text-violet-200">
            {estimatedOverall !== null ? `${estimatedOverall.toFixed(1)}%` : '—'}
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Model: {METHOD_METADATA[method].shortName}
          </p>
        </GlassCard>

        <GlassCard interactive className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Trajectory Velocity</p>
              <p className="mt-2 font-display font-mono-tabular text-3xl font-bold text-white">
                {series.length >= 2
                  ? slopePerAssessment > 0
                    ? `+${slopePerAssessment}`
                    : slopePerAssessment
                  : '—'}
                {series.length >= 2 && (
                  <span className="text-sm font-normal text-slate-400"> pts / eval</span>
                )}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05]">
              {slopePerAssessment > 0.35 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-300" />
              ) : slopePerAssessment < -0.35 ? (
                <ArrowDownRight className="w-4 h-4 text-rose-300" />
              ) : (
                <Minus className="w-4 h-4 text-slate-300" />
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
            <span>{series.length >= 2 ? trendLabel : 'Enter marks to compute trend'}</span>
          </p>
        </GlassCard>
      </div>

      {/* Main Recharts Dual-Line Chart (Actual vs Estimated) */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Actual vs. Estimated Assessment Marks
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover over any checkpoint to compare recorded marks and numerical estimates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowActual((v) => !v)}
              aria-pressed={showActual}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                showActual
                  ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                  : 'border-white/15 bg-white/[0.03] text-slate-400'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400" aria-hidden="true" />
              <span>Actual Marks</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEstimated((v) => !v)}
              aria-pressed={showEstimated}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                showEstimated
                  ? 'border-violet-400/40 bg-violet-400/15 text-violet-100'
                  : 'border-white/15 bg-white/[0.03] text-slate-400'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-violet-400" aria-hidden="true" />
              <span>Estimated Marks</span>
            </button>
          </div>
        </div>

        <div className="h-[310px] w-full">
          {series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 18, left: -12, bottom: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
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
                <Tooltip content={<AnalysisTooltip />} />
                {showEstimated && (
                  <Line
                    type="monotone"
                    dataKey="estimated"
                    name="Estimated Marks"
                    stroke="#A78BFA"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    animationDuration={300}
                    dot={{ r: 4, fill: '#A78BFA', stroke: '#040814', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#C4B5FD' }}
                  />
                )}
                {showActual && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Marks"
                    stroke="#38BDF8"
                    strokeWidth={3}
                    animationDuration={300}
                    connectNulls={false}
                    dot={{ r: 5, fill: '#38BDF8', stroke: '#040814', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#67E8F9' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-sm text-slate-300">
                No assessment marks recorded for {currentStudent.name} in {effectiveSubjectName}.
              </p>
              <GlassButton
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setActivePage('marks')}
              >
                Enter Marks
              </GlassButton>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Subject-Wise Analysis */}
      {subjectSummaries.length > 0 && (
        <GlassCard className="p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-white">
              Subject-Wise Performance Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mean versus peak recorded percentage across your subjects
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
            <div className="xl:col-span-7 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectSummaries}
                  margin={{ top: 8, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="subjectName"
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(8, 16, 38, 0.92)',
                      borderColor: 'rgba(255, 255, 255, 0.16)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="averageScore"
                    name="Mean Score (%)"
                    fill="#38BDF8"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="highestScore"
                    name="Peak Score (%)"
                    fill="#818CF8"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="xl:col-span-5 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400">
                    <th className="py-2.5 pr-2">Subject</th>
                    <th className="py-2.5 px-2 text-right">Min</th>
                    <th className="py-2.5 px-2 text-right">Mean</th>
                    <th className="py-2.5 pl-2 text-right">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {subjectSummaries.map((sub) => (
                    <tr key={sub.subjectName}>
                      <td className="py-2.5 pr-2 font-medium text-white">
                        {sub.subjectName}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono-tabular text-slate-300">
                        {sub.lowestScore.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono-tabular font-semibold text-cyan-200">
                        {sub.averageScore.toFixed(1)}%
                      </td>
                      <td className="py-2.5 pl-2 text-right font-mono-tabular text-violet-200">
                        {sub.highestScore.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
