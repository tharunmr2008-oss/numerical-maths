import React, { useMemo, useState } from 'react';
import { Check, Download, Printer, UserPlus } from 'lucide-react';
import {
  FloatingSelect,
  GlassButton,
  GlassCard,
} from '../components/GlassPrimitives';
import { useAcademic } from '../context/AcademicContext';
import { generateCsvReport } from '../utils/analytics';

export const ReportsPage: React.FC = () => {
  const { students, marks, settings, logActivity, navigateToAddStudent, setActivePage } =
    useAcademic();

  const [studentFilter, setStudentFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [standingFilter, setStandingFilter] = useState<'all' | 'passing' | 'below' | 'missing'>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const subjectNames = useMemo(() => {
    const set = new Set<string>();
    for (const m of marks) {
      if (m.subjectName.trim()) set.add(m.subjectName.trim());
    }
    return Array.from(set).sort();
  }, [marks]);

  const filteredMarks = useMemo(() => {
    return marks
      .filter((m) => {
        if (studentFilter !== 'all' && m.studentId !== studentFilter) return false;
        if (subjectFilter !== 'all' && m.subjectName.trim() !== subjectFilter) return false;

        if (standingFilter === 'missing') return m.score === null;
        if (standingFilter === 'passing') {
          return m.score !== null && (m.score / m.maxScore) * 100 >= settings.passingPercentage;
        }
        if (standingFilter === 'below') {
          return m.score !== null && (m.score / m.maxScore) * 100 < settings.passingPercentage;
        }
        return true;
      })
      .sort(
        (a, b) =>
          a.studentId.localeCompare(b.studentId) ||
          a.subjectName.localeCompare(b.subjectName) ||
          a.assessmentIndex - b.assessmentIndex
      );
  }, [marks, studentFilter, subjectFilter, standingFilter, settings.passingPercentage]);

  const handleExportCsv = () => {
    const csv = generateCsvReport(students, filteredMarks, settings.passingPercentage);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `academictrend-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logActivity(
      'report_exported',
      'Exported academic performance CSV',
      `${filteredMarks.length} assessment rows included`
    );
    setExportNotice(`Exported ${filteredMarks.length} rows to CSV.`);
    window.setTimeout(() => setExportNotice(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
        <div>
          <p className="text-xs font-medium text-cyan-300/90 mb-1">
            Audit & Export
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Academic Reports
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Filter evaluation records by student, subject, or threshold standing and export verified CSV ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <GlassButton variant="secondary" onClick={handlePrint} disabled={filteredMarks.length === 0}>
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </GlassButton>
          <GlassButton variant="primary" onClick={handleExportCsv} disabled={filteredMarks.length === 0}>
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </GlassButton>
        </div>
      </div>

      {exportNotice && (
        <div
          role="status"
          className="glass-panel-subtle rounded-xl px-4 py-3 text-sm text-cyan-100 border-cyan-400/35 flex items-center gap-2 no-print"
        >
          <Check className="w-4 h-4 text-cyan-300" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Filter Controls */}
      <GlassCard className="p-5 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FloatingSelect
            id="report-student"
            label="Filter Student"
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
          >
            <option value="all" className="bg-[#09132c] text-slate-100">
              All Students ({students.length})
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#09132c] text-slate-100">
                {s.name} ({s.registerNumber})
              </option>
            ))}
          </FloatingSelect>

          <FloatingSelect
            id="report-subject"
            label="Filter Subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="all" className="bg-[#09132c] text-slate-100">
              All Subjects ({subjectNames.length})
            </option>
            {subjectNames.map((sub) => (
              <option key={sub} value={sub} className="bg-[#09132c] text-slate-100">
                {sub}
              </option>
            ))}
          </FloatingSelect>

          <FloatingSelect
            id="report-standing"
            label="Standing Filter"
            value={standingFilter}
            onChange={(e) =>
              setStandingFilter(e.target.value as 'all' | 'passing' | 'below' | 'missing')
            }
          >
            <option value="all" className="bg-[#09132c] text-slate-100">
              All Evaluations
            </option>
            <option value="passing" className="bg-[#09132c] text-slate-100">
              Passing (≥ {settings.passingPercentage}%)
            </option>
            <option value="below" className="bg-[#09132c] text-slate-100">
              Below Threshold (&lt; {settings.passingPercentage}%)
            </option>
            <option value="missing" className="bg-[#09132c] text-slate-100">
              Missing Marks Only
            </option>
          </FloatingSelect>
        </div>
      </GlassCard>

      {/* Printable Ledger Table */}
      <GlassCard className="overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">
            Assessment Ledger ({filteredMarks.length} records)
          </h2>
          <span className="text-xs text-slate-400">
            Threshold: {settings.passingPercentage}%
          </span>
        </div>

        {students.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-300">
              No students added yet. Add a student and enter marks to generate reports.
            </p>
            <GlassButton size="sm" variant="primary" className="mt-4" onClick={navigateToAddStudent}>
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </GlassButton>
          </div>
        ) : filteredMarks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-300">
              No assessment records match the selected filters.
            </p>
            {marks.length === 0 && (
              <GlassButton
                size="sm"
                variant="secondary"
                className="mt-4"
                onClick={() => setActivePage('marks')}
              >
                Enter Assessment Marks
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs font-medium text-slate-400">
                  <th className="py-3 px-5">Student</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4 text-right">Score</th>
                  <th className="py-3 px-4 text-right">Percentage</th>
                  <th className="py-3 px-5 text-right">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredMarks.map((m) => {
                  const stu = studentMap.get(m.studentId);
                  const pct =
                    m.score !== null && m.maxScore > 0 ? (m.score / m.maxScore) * 100 : null;
                  const standing =
                    pct === null
                      ? 'Pending Interpolation'
                      : pct >= settings.passingPercentage
                        ? 'Passing'
                        : 'Below Threshold';

                  return (
                    <tr key={m.id} className="hover:bg-white/[0.025]">
                      <td className="py-3 px-5">
                        <span className="block font-medium text-white">
                          {stu?.name ?? 'Unknown'}
                        </span>
                        <span className="text-xs font-mono-tabular text-cyan-200">
                          {stu?.registerNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {m.subjectName || stu?.subjectName || 'General'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.assessmentLabel}
                        <span className="block text-xs font-mono-tabular text-slate-500">
                          Index {m.assessmentIndex} · {m.date}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular text-slate-200">
                        {m.score !== null ? `${m.score} / ${m.maxScore}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular font-semibold text-white">
                        {pct !== null ? `${pct.toFixed(1)}%` : '—'}
                      </td>
                      <td
                        className={`py-3 px-5 text-right text-xs font-medium ${
                          pct === null
                            ? 'text-amber-300'
                            : pct >= settings.passingPercentage
                              ? 'text-emerald-300'
                              : 'text-rose-300'
                        }`}
                      >
                        {standing}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
