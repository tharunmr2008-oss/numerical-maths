import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  FunctionSquare,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
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
import {
  InterpolationMethod,
  InterpolationPoint,
  InterpolationResult,
} from '../types/academic';
import { METHOD_METADATA, runInterpolation } from '../utils/interpolation';

const METHODS: InterpolationMethod[] = ['lagrange', 'newton', 'spline', 'linear'];

export const InterpolationCalculatorPage: React.FC = () => {
  const {
    students,
    marks,
    settings,
    selectedStudentId,
    setSelectedStudentId,
    selectedSubjectName,
    setSelectedSubjectName,
    recordAnalysisRun,
    setActivePage,
    navigateToAddStudent,
  } = useAcademic();

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

  const subjectMarks = useMemo(() => {
    if (!currentStudent) return [];
    return marks
      .filter(
        (m) =>
          m.studentId === currentStudent.id &&
          m.subjectName.trim().toLowerCase() === effectiveSubjectName.trim().toLowerCase()
      )
      .sort((a, b) => a.assessmentIndex - b.assessmentIndex);
  }, [marks, currentStudent, effectiveSubjectName]);

  const knownPoints: InterpolationPoint[] = useMemo(
    () =>
      subjectMarks
        .filter((m) => m.score !== null && m.maxScore > 0)
        .map((m) => ({
          x: m.assessmentIndex,
          y: Math.round(((m.score as number) / m.maxScore) * 10000) / 100,
          label: m.assessmentLabel,
        })),
    [subjectMarks]
  );

  const missingOptions = useMemo(
    () => subjectMarks.filter((m) => m.score === null),
    [subjectMarks]
  );

  const [method, setMethod] = useState<InterpolationMethod>(settings.defaultMethod);
  const [targetX, setTargetX] = useState<string>('3');
  const [output, setOutput] = useState<InterpolationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    if (missingOptions.length > 0) {
      setTargetX(String(missingOptions[0].assessmentIndex));
    } else if (subjectMarks.length > 0) {
      const nextIdx = subjectMarks[subjectMarks.length - 1].assessmentIndex + 1;
      setTargetX(String(nextIdx));
    }
  }, [currentStudent?.id, effectiveSubjectName, missingOptions, subjectMarks]);

  const performCalculation = (shouldRecord = false) => {
    const parsedTarget = Number(targetX);
    const res = runInterpolation(knownPoints, parsedTarget, method, 100);
    if (!res.ok) {
      setCalcError(res.error);
      setOutput(null);
      return;
    }
    setCalcError(null);
    setOutput(res.result);

    if (shouldRecord && currentStudent) {
      recordAnalysisRun(
        `${METHOD_METADATA[method].name} evaluated`,
        `${currentStudent.name} · ${effectiveSubjectName} x=${parsedTarget} → ${res.result.clampedEstimate.toFixed(1)}%`
      );
    }
  };

  useEffect(() => {
    if (knownPoints.length >= 2 && targetX !== '') {
      performCalculation(false);
    } else {
      setOutput(null);
      setCalcError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownPoints, method, targetX]);

  const methodMeta = METHOD_METADATA[method];

  if (!currentStudent) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-cyan-300/90 mb-1">
            Step 3 · Numerical Estimation Engine
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Interpolation Calculator
          </h1>
        </div>
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-slate-200">
            No students added yet. Add your first student and enter assessment marks to calculate estimates.
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
          Step 3 · Numerical Estimation Engine
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          Interpolation Calculator
        </h1>
        <p className="mt-1 text-sm text-slate-300 max-w-2xl">
          Select a student, choose the missing assessment, and compute the estimated mark with Lagrange or spline interpolation.
        </p>
      </div>

      {/* Controls & Parameters Card */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <FloatingSelect
            id="calc-student"
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
            id="calc-subject"
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
            id="calc-method"
            label="Numerical Method"
            value={method}
            onChange={(e) => setMethod(e.target.value as InterpolationMethod)}
          >
            {METHODS.map((m) => (
              <option key={m} value={m} className="bg-[#09132c] text-slate-100">
                {METHOD_METADATA[m].shortName} Interpolation
              </option>
            ))}
          </FloatingSelect>

          <FloatingSelect
            id="calc-target-x"
            label="Target Assessment"
            value={targetX}
            onChange={(e) => setTargetX(e.target.value)}
          >
            {missingOptions.map((m) => (
              <option
                key={m.id}
                value={m.assessmentIndex}
                className="bg-[#09132c] text-amber-200"
              >
                x={m.assessmentIndex} · {m.assessmentLabel} (Missing)
              </option>
            ))}
            {[1, 2, 3, 4, 5, 6, 7].map((idx) => {
              const alreadyMissing = missingOptions.some(
                (m) => m.assessmentIndex === idx
              );
              if (alreadyMissing) return null;
              const existing = subjectMarks.find((m) => m.assessmentIndex === idx);
              return (
                <option key={idx} value={idx} className="bg-[#09132c] text-slate-100">
                  x={idx} · {existing ? `${existing.assessmentLabel}` : `Assessment ${idx}`}
                </option>
              );
            })}
          </FloatingSelect>
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-300">
            Method: <span className="font-medium text-cyan-200">{methodMeta.name}</span> · Evaluating at{' '}
            <span className="font-mono-tabular text-white">x = {targetX}</span>
          </p>
          <GlassButton
            type="button"
            variant="primary"
            onClick={() => performCalculation(true)}
            className="px-5"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculate</span>
          </GlassButton>
        </div>
      </GlassCard>

      {knownPoints.length < 2 && !calcError && (
        <GlassCard className="p-8 text-center space-y-4">
          <p className="font-display text-lg font-semibold text-white">
            Insufficient Recorded Marks for Interpolation
          </p>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            {currentStudent.name} currently has {knownPoints.length} recorded mark{knownPoints.length === 1 ? '' : 's'} in {effectiveSubjectName}. At least 2 known assessments are required to fit an interpolation curve.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <GlassButton variant="primary" onClick={() => setActivePage('marks')}>
              Enter Marks for {currentStudent.name}
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {calcError && (
        <GlassCard className="p-5 border-rose-400/40 bg-rose-500/10">
          <div role="alert" className="flex items-start gap-3 text-sm text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Calculation Unable to Proceed</p>
              <p className="mt-0.5">{calcError}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {output && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            <GlassCard interactive className="xl:col-span-5 p-6 flex flex-col justify-between border-cyan-300/35">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-cyan-300">
                    Estimated Mark Result
                  </span>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                </div>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="font-display font-mono-tabular text-5xl font-bold text-white tracking-tight">
                    {output.clampedEstimate.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono-tabular">
                    at x = {output.targetX}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>{output.confidenceLabel}</span>
                </p>

                {output.isClamped && (
                  <p className="mt-2 text-xs text-amber-200/90">
                    Unclamped polynomial output: <span className="font-mono-tabular">{output.rawEstimate.toFixed(2)}</span> (bounded to 0–100%).
                  </p>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-200 mb-2">
                  <FunctionSquare className="w-4 h-4 text-indigo-300" />
                  <span>{output.formulaTitle}</span>
                </div>
                <p className="font-mono-tabular text-xs text-cyan-100 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 overflow-x-auto">
                  {output.formulaEquation}
                </p>
                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                  {methodMeta.formulaDescription}
                </p>
              </div>
            </GlassCard>

            <GlassCard className="xl:col-span-7 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">
                    Interpolated Curve Preview
                  </h2>
                  <p className="text-xs text-slate-400">
                    Continuous {methodMeta.shortName} trajectory through {knownPoints.length} known assessments
                  </p>
                </div>
                <span className="text-xs font-mono-tabular text-cyan-200">
                  Target P({output.targetX}) = {output.clampedEstimate.toFixed(1)}%
                </span>
              </div>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={output.curveSamples}
                    margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="x"
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      tickFormatter={(v) => `A${v}`}
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
                    <Line
                      type="monotone"
                      dataKey="estimated"
                      name="Interpolated Curve"
                      stroke="#A78BFA"
                      strokeWidth={2.5}
                      animationDuration={300}
                      dot={{ r: 3.5, fill: '#A78BFA' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Known Marks"
                      stroke="#38BDF8"
                      strokeWidth={2}
                      animationDuration={300}
                      connectNulls={false}
                      dot={{ r: 5, fill: '#38BDF8', stroke: '#040814', strokeWidth: 2 }}
                    />
                    <ReferenceDot
                      x={output.targetX}
                      y={output.clampedEstimate}
                      r={7}
                      fill="#22D3EE"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <GlassCard className="xl:col-span-4 p-6">
              <h2 className="font-display text-lg font-semibold text-white mb-1">
                Known Assessment Marks
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Data points (xᵢ, yᵢ) used to fit the model
              </p>

              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-xs text-slate-400">
                    <th className="py-2 pr-2">xᵢ</th>
                    <th className="py-2 px-2">Assessment</th>
                    <th className="py-2 pl-2 text-right">Mark yᵢ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {output.knownPoints.map((pt) => (
                    <tr key={pt.x}>
                      <td className="py-2.5 pr-2 font-mono-tabular text-cyan-300">
                        {pt.x}
                      </td>
                      <td className="py-2.5 px-2 text-slate-200">{pt.label}</td>
                      <td className="py-2.5 pl-2 text-right font-mono-tabular font-semibold text-white">
                        {pt.y.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>

            <GlassCard className="xl:col-span-8 p-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Step-by-Step Mathematical Calculation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exact intermediate evaluations for {methodMeta.name} at x = {output.targetX}
                </p>
              </div>

              <div className="divide-y divide-white/[0.08]">
                {output.steps.map((step) => (
                  <div key={step.stepNumber} className="py-3.5 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium text-white">
                      {step.stepNumber}. {step.title}
                    </p>
                    <p className="mt-1.5 font-mono-tabular text-xs text-slate-300 break-words">
                      {step.expression}
                    </p>
                    {step.value && (
                      <p className="mt-1 font-mono-tabular text-xs font-semibold text-cyan-300">
                        {step.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {output.dividedDifferenceTable && (
                <div className="pt-4 border-t border-white/[0.08]">
                  <h3 className="font-display text-sm font-semibold text-white mb-3">
                    Divided Difference Table
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono-tabular">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400">
                          <th className="py-2 pr-3">xᵢ</th>
                          {output.dividedDifferenceTable.map((_, order) => (
                            <th key={order} className="py-2 px-3">
                              Order {order}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {output.dividedDifferenceTable.map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-2 pr-3 text-cyan-300">{row.x}</td>
                            {row.differences.map((diff, order) => (
                              <td key={order} className="py-2 px-3 text-slate-200">
                                {diff}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
};
