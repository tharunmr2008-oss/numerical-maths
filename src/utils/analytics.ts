import { AssessmentMark, InterpolationMethod, Student } from '../types/academic';
import { runInterpolation } from './interpolation';

export interface DashboardKPIs {
  totalStudents: number;
  analysesCount: number;
  subjectsCount: number;
  averageMarks: number | null;
  trendDelta: number | null;
  trendDirection: 'up' | 'down' | 'flat' | 'none';
  completedAssessments: number;
  missingAssessments: number;
}

export interface SubjectSummary {
  subjectName: string;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  assessmentCount: number;
  missingCount: number;
}

export interface SeriesPoint {
  assessmentIndex: number;
  label: string;
  actual: number | null;
  estimated: number | null;
}

export function computeDashboardKPIs(
  students: Student[],
  marks: AssessmentMark[],
  analysesCount: number
): DashboardKPIs {
  const validMarks = marks.filter((m) => m.score !== null && m.maxScore > 0);
  const missingAssessments = marks.filter((m) => m.score === null).length;

  const averageMarks =
    validMarks.length > 0
      ? Math.round(
          (validMarks.reduce((acc, m) => acc + ((m.score as number) / m.maxScore) * 100, 0) /
            validMarks.length) *
            10
        ) / 10
      : null;

  const subjectSet = new Set<string>();
  for (const s of students) {
    if (s.subjectName.trim()) subjectSet.add(s.subjectName.trim());
  }
  for (const m of marks) {
    if (m.subjectName.trim()) subjectSet.add(m.subjectName.trim());
  }

  let trendDelta: number | null = null;
  let trendDirection: DashboardKPIs['trendDirection'] = 'none';

  if (validMarks.length >= 2) {
    const sorted = [...validMarks].sort((a, b) => a.assessmentIndex - b.assessmentIndex);
    const mid = Math.floor(sorted.length / 2);
    const early = sorted.slice(0, mid);
    const recent = sorted.slice(mid);
    const earlyAvg =
      early.reduce((acc, m) => acc + ((m.score as number) / m.maxScore) * 100, 0) / early.length;
    const recentAvg =
      recent.reduce((acc, m) => acc + ((m.score as number) / m.maxScore) * 100, 0) / recent.length;

    trendDelta = Math.round((recentAvg - earlyAvg) * 10) / 10;
    trendDirection = trendDelta > 0.4 ? 'up' : trendDelta < -0.4 ? 'down' : 'flat';
  }

  return {
    totalStudents: students.length,
    analysesCount,
    subjectsCount: subjectSet.size,
    averageMarks,
    trendDelta,
    trendDirection,
    completedAssessments: validMarks.length,
    missingAssessments,
  };
}

export function computeSubjectSummaries(marks: AssessmentMark[]): SubjectSummary[] {
  const grouped = new Map<string, AssessmentMark[]>();
  for (const m of marks) {
    const name = m.subjectName.trim() || 'General Subject';
    const arr = grouped.get(name);
    if (arr) arr.push(m);
    else grouped.set(name, [m]);
  }

  return Array.from(grouped.entries()).map(([subjectName, subMarks]) => {
    const valid = subMarks.filter((m) => m.score !== null && m.maxScore > 0);
    const missingCount = subMarks.length - valid.length;

    if (valid.length === 0) {
      return {
        subjectName,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        assessmentCount: 0,
        missingCount,
      };
    }

    const percentages = valid.map((m) => ((m.score as number) / m.maxScore) * 100);
    const sum = percentages.reduce((a, b) => a + b, 0);

    return {
      subjectName,
      averageScore: Math.round((sum / valid.length) * 10) / 10,
      highestScore: Math.round(Math.max(...percentages) * 10) / 10,
      lowestScore: Math.round(Math.min(...percentages) * 10) / 10,
      assessmentCount: valid.length,
      missingCount,
    };
  });
}

export function buildPerformanceSeries(
  marks: AssessmentMark[],
  studentId: string,
  subjectName: string,
  method: InterpolationMethod
): {
  series: SeriesPoint[];
  slopePerAssessment: number;
  actualAverage: number | null;
  estimatedOverall: number | null;
} {
  const normalizedTarget = subjectName.trim().toLowerCase();
  const filtered = marks
    .filter(
      (m) =>
        m.studentId === studentId &&
        (normalizedTarget === '' || m.subjectName.trim().toLowerCase() === normalizedTarget)
    )
    .sort((a, b) => a.assessmentIndex - b.assessmentIndex);

  if (filtered.length === 0) {
    return {
      series: [],
      slopePerAssessment: 0,
      actualAverage: null,
      estimatedOverall: null,
    };
  }

  const knownPoints = filtered
    .filter((m) => m.score !== null && m.maxScore > 0)
    .map((m) => ({
      x: m.assessmentIndex,
      y: Math.round((((m.score as number) / m.maxScore) * 100) * 100) / 100,
      label: m.assessmentLabel,
    }));

  const series: SeriesPoint[] = filtered.map((m) => {
    const actual =
      m.score !== null && m.maxScore > 0
        ? Math.round((((m.score as number) / m.maxScore) * 100) * 10) / 10
        : null;
    let estimated: number | null = actual;

    if (knownPoints.length >= 2) {
      const trainingPoints =
        m.score === null
          ? knownPoints
          : knownPoints.length > 2
            ? knownPoints.filter((p) => p.x !== m.assessmentIndex)
            : knownPoints;
      const res = runInterpolation(trainingPoints, m.assessmentIndex, method, 100);
      if (res.ok) {
        estimated = res.result.clampedEstimate;
      }
    }

    return {
      assessmentIndex: m.assessmentIndex,
      label: m.assessmentLabel,
      actual,
      estimated,
    };
  });

  const validActuals = series.map((s) => s.actual).filter((v): v is number => v !== null);
  const validEstimates = series.map((s) => s.estimated).filter((v): v is number => v !== null);

  const actualAverage =
    validActuals.length > 0
      ? Math.round((validActuals.reduce((a, b) => a + b, 0) / validActuals.length) * 10) / 10
      : null;
  const estimatedOverall =
    validEstimates.length > 0
      ? Math.round((validEstimates.reduce((a, b) => a + b, 0) / validEstimates.length) * 10) / 10
      : null;

  let slopePerAssessment = 0;
  if (knownPoints.length >= 2) {
    const n = knownPoints.length;
    const meanX = knownPoints.reduce((acc, p) => acc + p.x, 0) / n;
    const meanY = knownPoints.reduce((acc, p) => acc + p.y, 0) / n;
    const num = knownPoints.reduce((acc, p) => acc + (p.x - meanX) * (p.y - meanY), 0);
    const den = knownPoints.reduce((acc, p) => acc + Math.pow(p.x - meanX, 2), 0);
    slopePerAssessment = den > 0 ? Math.round((num / den) * 100) / 100 : 0;
  }

  return { series, slopePerAssessment, actualAverage, estimatedOverall };
}

export function buildCohortTimelineSeries(marks: AssessmentMark[]): Array<{
  assessment: string;
  averageScore: number;
  topScore: number;
  count: number;
}> {
  const byIndex = new Map<number, { label: string; scores: number[] }>();
  for (const m of marks) {
    if (m.score === null || m.maxScore <= 0) continue;
    const pct = (m.score / m.maxScore) * 100;
    const existing = byIndex.get(m.assessmentIndex);
    if (existing) {
      existing.scores.push(pct);
    } else {
      byIndex.set(m.assessmentIndex, { label: m.assessmentLabel, scores: [pct] });
    }
  }

  return Array.from(byIndex.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, group]) => ({
      assessment: group.label,
      averageScore:
        Math.round((group.scores.reduce((a, b) => a + b, 0) / group.scores.length) * 10) / 10,
      topScore: Math.round(Math.max(...group.scores) * 10) / 10,
      count: group.scores.length,
    }));
}

export function getStudentAverage(studentId: string, marks: AssessmentMark[]): number | null {
  const valid = marks.filter((m) => m.studentId === studentId && m.score !== null && m.maxScore > 0);
  if (valid.length === 0) return null;
  const avg =
    valid.reduce((acc, m) => acc + ((m.score as number) / m.maxScore) * 100, 0) / valid.length;
  return Math.round(avg * 10) / 10;
}

export function generateCsvReport(
  students: Student[],
  marks: AssessmentMark[],
  passingPercentage: number
): string {
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const headers = [
    'Register Number',
    'Student Name',
    'Subject Name',
    'Assessment Index',
    'Assessment Label',
    'Score',
    'Max Score',
    'Percentage',
    'Standing',
    'Date',
  ];

  const rows = marks
    .slice()
    .sort(
      (a, b) =>
        a.studentId.localeCompare(b.studentId) ||
        a.subjectName.localeCompare(b.subjectName) ||
        a.assessmentIndex - b.assessmentIndex
    )
    .map((m) => {
      const stu = studentMap.get(m.studentId);
      const pct = m.score !== null && m.maxScore > 0 ? Math.round(((m.score / m.maxScore) * 100) * 10) / 10 : '';
      const standing =
        m.score === null
          ? 'Missing'
          : (m.score / m.maxScore) * 100 >= passingPercentage
            ? 'Passing'
            : 'Below Threshold';

      return [
        stu?.registerNumber ?? '',
        stu?.name ?? '',
        m.subjectName || stu?.subjectName || 'General',
        m.assessmentIndex,
        m.assessmentLabel,
        m.score ?? 'Missing',
        m.maxScore,
        pct === '' ? 'N/A' : `${pct}%`,
        standing,
        m.date,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',');
    });

  return [headers.join(','), ...rows].join('\n');
}
