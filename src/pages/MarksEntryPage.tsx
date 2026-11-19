import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  Check,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  FloatingInput,
  FloatingSelect,
  GlassButton,
  GlassCard,
} from '../components/GlassPrimitives';
import { useAcademic } from '../context/AcademicContext';
import { ASSESSMENT_TEMPLATES } from '../data/seedData';

interface EditableMarkRow {
  id: string;
  assessmentIndex: number;
  assessmentLabel: string;
  scoreText: string; // "" means Missing (null)
  maxScoreText: string;
  date: string;
}

export const MarksEntryPage: React.FC = () => {
  const {
    students,
    marks,
    selectedStudentId,
    setSelectedStudentId,
    selectedSubjectName,
    setSelectedSubjectName,
    upsertMarksForPair,
    setActivePage,
    navigateToAddStudent,
  } = useAcademic();

  const currentStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? students[0],
    [students, selectedStudentId]
  );

  const [subjectInput, setSubjectInput] = useState<string>('');
  const [rows, setRows] = useState<EditableMarkRow[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Determine default subject name when switching student
  useEffect(() => {
    if (!currentStudent) return;
    const studentSubjects = Array.from(
      new Set(
        marks
          .filter((m) => m.studentId === currentStudent.id)
          .map((m) => m.subjectName.trim())
          .filter(Boolean)
      )
    );
    if (
      selectedSubjectName &&
      studentSubjects.some(
        (s) => s.toLowerCase() === selectedSubjectName.trim().toLowerCase()
      )
    ) {
      setSubjectInput(selectedSubjectName);
    } else if (currentStudent.subjectName.trim()) {
      setSubjectInput(currentStudent.subjectName.trim());
    } else if (studentSubjects.length > 0) {
      setSubjectInput(studentSubjects[0]);
    } else {
      setSubjectInput('General');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent?.id]);

  const effectiveSubject = subjectInput.trim() || 'General';

  const loadRowsFromStore = (studentId: string, subjectName: string) => {
    const cleanSub = subjectName.trim().toLowerCase();
    const existing = marks
      .filter(
        (m) =>
          m.studentId === studentId &&
          m.subjectName.trim().toLowerCase() === cleanSub
      )
      .sort((a, b) => a.assessmentIndex - b.assessmentIndex);

    if (existing.length > 0) {
      setRows(
        existing.map((m) => ({
          id: m.id,
          assessmentIndex: m.assessmentIndex,
          assessmentLabel: m.assessmentLabel,
          scoreText: m.score === null ? '' : String(m.score),
          maxScoreText: String(m.maxScore),
          date: m.date,
        }))
      );
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setRows(
        ASSESSMENT_TEMPLATES.slice(0, 4).map((tpl) => ({
          id: `new-${tpl.index}-${Date.now()}`,
          assessmentIndex: tpl.index,
          assessmentLabel: tpl.label,
          scoreText: '',
          maxScoreText: '100',
          date: today,
        }))
      );
    }
    setValidationError(null);
    setSaveMessage(null);
  };

  useEffect(() => {
    if (currentStudent) {
      loadRowsFromStore(currentStudent.id, effectiveSubject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent?.id, effectiveSubject]);

  const addAssessmentRow = () => {
    const maxIdx = rows.reduce((m, r) => Math.max(m, r.assessmentIndex), 0);
    const nextIdx = maxIdx + 1;
    const tpl = ASSESSMENT_TEMPLATES.find((t) => t.index === nextIdx);
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${nextIdx}`,
        assessmentIndex: nextIdx,
        assessmentLabel: tpl?.label ?? `Assessment ${nextIdx}`,
        scoreText: '',
        maxScoreText: '100',
        date: new Date().toISOString().slice(0, 10),
      },
    ]);
    setValidationError(null);
  };

  const deleteAssessmentRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setValidationError(null);
  };

  const updateRow = (id: string, patch: Partial<EditableMarkRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setValidationError(null);
    setSaveMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    if (rows.length === 0) {
      setValidationError('Add at least one assessment before saving.');
      return;
    }

    const indices = new Set<number>();
    const parsedEntries: Array<{
      id: string;
      assessmentIndex: number;
      assessmentLabel: string;
      score: number | null;
      maxScore: number;
      date: string;
    }> = [];

    for (const r of rows) {
      if (!r.assessmentLabel.trim()) {
        setValidationError(`Assessment #${r.assessmentIndex} requires a label.`);
        return;
      }
      if (!Number.isInteger(r.assessmentIndex) || r.assessmentIndex < 1) {
        setValidationError('Assessment indices must be positive whole numbers.');
        return;
      }
      if (indices.has(r.assessmentIndex)) {
        setValidationError(
          `Duplicate assessment index ${r.assessmentIndex}. Each assessment index must be unique.`
        );
        return;
      }
      indices.add(r.assessmentIndex);

      const maxScore = Number(r.maxScoreText);
      if (!Number.isFinite(maxScore) || maxScore <= 0) {
        setValidationError(
          `Max score for "${r.assessmentLabel}" must be greater than 0.`
        );
        return;
      }

      const trimmedScore = r.scoreText.trim();
      let score: number | null = null;
      if (trimmedScore !== '') {
        const parsed = Number(trimmedScore);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > maxScore) {
          setValidationError(
            `Score for "${r.assessmentLabel}" must be between 0 and ${maxScore}, or left blank if missing.`
          );
          return;
        }
        score = Math.round(parsed * 100) / 100;
      }

      parsedEntries.push({
        id: r.id,
        assessmentIndex: r.assessmentIndex,
        assessmentLabel: r.assessmentLabel.trim(),
        score,
        maxScore,
        date: r.date || new Date().toISOString().slice(0, 10),
      });
    }

    upsertMarksForPair(currentStudent.id, effectiveSubject, parsedEntries);
    setSelectedSubjectName(effectiveSubject);
    setSaveMessage(
      `Saved ${parsedEntries.length} assessments for ${currentStudent.name} (${effectiveSubject}).`
    );
  };

  const summary = useMemo(() => {
    const valid = rows.filter((r) => r.scoreText.trim() !== '' && Number(r.maxScoreText) > 0);
    const missing = rows.length - valid.length;
    const avg =
      valid.length > 0
        ? valid.reduce(
            (acc, r) => acc + (Number(r.scoreText) / Number(r.maxScoreText)) * 100,
            0
          ) / valid.length
        : null;
    return { recorded: valid.length, missing, avg };
  }, [rows]);

  if (!currentStudent) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-cyan-300/90 mb-1">
            Step 2 · Assessment Records
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Marks Entry
          </h1>
        </div>
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-slate-200">
            No students added yet. Add your first student before entering marks.
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-cyan-300/90 mb-1">
            Step 2 · Assessment Records
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Marks Entry
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Enter known assessment marks and leave any missed evaluation blank to estimate it with interpolation.
          </p>
        </div>

        <GlassButton
          variant="secondary"
          onClick={() => {
            setSelectedStudentId(currentStudent.id);
            setSelectedSubjectName(effectiveSubject);
            setActivePage('interpolation');
          }}
        >
          <Calculator className="w-4 h-4" />
          <span>Interpolate Missing Marks</span>
        </GlassButton>
      </div>

      {/* Selector Bar */}
      <GlassCard className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5">
            <FloatingSelect
              id="marks-student-select"
              label="Select Student"
              value={currentStudent.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id} className="bg-[#09132c] text-slate-100">
                  {stu.name} ({stu.registerNumber})
                </option>
              ))}
            </FloatingSelect>
          </div>

          <div className="md:col-span-4">
            <FloatingInput
              id="marks-subject-input"
              label="Subject Name"
              placeholder="e.g., Numerical Methods"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
            />
          </div>

          <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-5 text-xs text-slate-300 px-1">
            <div>
              <span className="block text-slate-400">Recorded / Missing</span>
              <span className="font-mono-tabular text-sm font-semibold text-white">
                {summary.recorded} · <span className="text-amber-300">{summary.missing} missing</span>
              </span>
            </div>
            <div className="text-right">
              <span className="block text-slate-400">Mean</span>
              <span className="font-mono-tabular text-sm font-semibold text-cyan-200">
                {summary.avg !== null ? `${summary.avg.toFixed(1)}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Assessment Table Form */}
      <GlassCard className="p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-white">
              Assessment Evaluations
            </h2>
            <GlassButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={addAssessmentRow}
            >
              <Plus className="w-4 h-4" />
              <span>Add Assessment</span>
            </GlassButton>
          </div>

          {validationError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-200 flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {saveMessage && (
            <div
              role="status"
              className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-3 text-sm text-cyan-100 flex flex-wrap items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>{saveMessage}</span>
              </span>
              <GlassButton
                type="button"
                size="sm"
                variant="primary"
                onClick={() => {
                  setSelectedStudentId(currentStudent.id);
                  setSelectedSubjectName(effectiveSubject);
                  setActivePage('interpolation');
                }}
              >
                Calculate Missing Mark
              </GlassButton>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs font-medium text-slate-400">
                  <th className="py-3 pr-3 w-20">Index x</th>
                  <th className="py-3 px-3 min-w-[180px]">Assessment Name</th>
                  <th className="py-3 px-3 w-40">Score (Blank = Missing)</th>
                  <th className="py-3 px-3 w-28">Max Score</th>
                  <th className="py-3 px-3 w-40">Date</th>
                  <th className="py-3 pl-3 text-right w-20">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rows.map((row) => {
                  const isMissing = row.scoreText.trim() === '';
                  return (
                    <tr key={row.id} className="group">
                      <td className="py-3 pr-3">
                        <input
                          type="number"
                          min={1}
                          aria-label={`Index for ${row.assessmentLabel}`}
                          value={row.assessmentIndex}
                          onChange={(e) =>
                            updateRow(row.id, {
                              assessmentIndex: Number(e.target.value),
                            })
                          }
                          className="glass-input w-full rounded-lg px-2.5 py-2 text-sm font-mono-tabular text-cyan-200"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          aria-label={`Label for assessment ${row.assessmentIndex}`}
                          value={row.assessmentLabel}
                          onChange={(e) =>
                            updateRow(row.id, { assessmentLabel: e.target.value })
                          }
                          className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          placeholder="Missing"
                          aria-label={`Score for ${row.assessmentLabel}`}
                          value={row.scoreText}
                          onChange={(e) =>
                            updateRow(row.id, { scoreText: e.target.value })
                          }
                          className={`glass-input w-full rounded-lg px-3 py-2 text-sm font-mono-tabular ${
                            isMissing ? 'text-amber-300 border-amber-400/35' : 'text-white'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min={1}
                          aria-label={`Max score for ${row.assessmentLabel}`}
                          value={row.maxScoreText}
                          onChange={(e) =>
                            updateRow(row.id, { maxScoreText: e.target.value })
                          }
                          className="glass-input w-full rounded-lg px-3 py-2 text-sm font-mono-tabular text-slate-200"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="date"
                          aria-label={`Date for ${row.assessmentLabel}`}
                          value={row.date}
                          onChange={(e) => updateRow(row.id, { date: e.target.value })}
                          className="glass-input w-full rounded-lg px-3 py-2 text-sm font-mono-tabular text-slate-300"
                        />
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          aria-label={`Delete ${row.assessmentLabel}`}
                          onClick={() => deleteAssessmentRow(row.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] text-slate-400 hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => loadRowsFromStore(currentStudent.id, effectiveSubject)}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Cancel</span>
            </GlassButton>
            <GlassButton type="submit" variant="primary">
              <Save className="w-4 h-4" />
              <span>Save Marks</span>
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
