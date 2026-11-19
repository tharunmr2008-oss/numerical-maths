import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPerformanceSeries,
  computeDashboardKPIs,
  computeSubjectSummaries,
  generateCsvReport,
} from './analytics';
import { AssessmentMark, Student } from '../types/academic';

const sampleStudents: Student[] = [
  {
    id: 's1',
    name: 'Ananya Sharma',
    registerNumber: '24CS042',
    subjectName: 'Numerical Methods',
    createdAt: '2026-11-18T10:00:00.000Z',
  },
];

const sampleMarks: AssessmentMark[] = [
  {
    id: 'm1',
    studentId: 's1',
    subjectName: 'Numerical Methods',
    assessmentIndex: 1,
    assessmentLabel: 'Quiz 1',
    score: 78,
    maxScore: 100,
    date: '2026-10-01',
  },
  {
    id: 'm2',
    studentId: 's1',
    subjectName: 'Numerical Methods',
    assessmentIndex: 2,
    assessmentLabel: 'Assignment 1',
    score: 84,
    maxScore: 100,
    date: '2026-10-12',
  },
  {
    id: 'm3',
    studentId: 's1',
    subjectName: 'Numerical Methods',
    assessmentIndex: 3,
    assessmentLabel: 'Midterm Exam',
    score: null,
    maxScore: 100,
    date: '2026-10-25',
  },
  {
    id: 'm4',
    studentId: 's1',
    subjectName: 'Numerical Methods',
    assessmentIndex: 4,
    assessmentLabel: 'Lab Evaluation',
    score: 92,
    maxScore: 100,
    date: '2026-11-05',
  },
];

test('computeDashboardKPIs starts cleanly at zero when no students or marks exist', () => {
  const kpis = computeDashboardKPIs([], [], 0);
  assert.equal(kpis.totalStudents, 0);
  assert.equal(kpis.analysesCount, 0);
  assert.equal(kpis.averageMarks, null);
  assert.equal(kpis.trendDelta, null);
  assert.equal(kpis.trendDirection, 'none');
});

test('computeDashboardKPIs computes accurate stats from user-entered records', () => {
  const kpis = computeDashboardKPIs(sampleStudents, sampleMarks, 2);
  assert.equal(kpis.totalStudents, 1);
  assert.equal(kpis.analysesCount, 2);
  assert.equal(kpis.subjectsCount, 1);
  assert.equal(kpis.completedAssessments, 3);
  assert.equal(kpis.missingAssessments, 1);
  assert.equal(kpis.averageMarks, 84.7);
  assert.equal(kpis.trendDirection, 'up');
});

test('computeSubjectSummaries groups marks by dynamic subjectName', () => {
  const summaries = computeSubjectSummaries(sampleMarks);
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].subjectName, 'Numerical Methods');
  assert.equal(summaries[0].missingCount, 1);
  assert.equal(summaries[0].highestScore, 92);
});

test('buildPerformanceSeries estimates missing assessment 3 using Lagrange interpolation', () => {
  const { series, slopePerAssessment } = buildPerformanceSeries(
    sampleMarks,
    's1',
    'Numerical Methods',
    'lagrange'
  );
  assert.equal(series.length, 4);
  const missing = series.find((p) => p.assessmentIndex === 3);
  assert.ok(missing);
  assert.equal(missing.actual, null);
  assert.ok(missing.estimated !== null && missing.estimated > 85 && missing.estimated < 91);
  assert.ok(slopePerAssessment > 0);
});

test('generateCsvReport outputs valid header and rows using register number and subject name', () => {
  const csv = generateCsvReport(sampleStudents, sampleMarks, 60);
  const lines = csv.split('\n');
  assert.equal(lines.length, sampleMarks.length + 1);
  assert.ok(lines[0].includes('Register Number'));
  assert.ok(lines[1].includes('24CS042'));
  assert.ok(lines[1].includes('Ananya Sharma'));
});
