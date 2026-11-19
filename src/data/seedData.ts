import { ActivityLog, AppSettings, AssessmentMark, Student } from '../types/academic';

export const DEFAULT_STUDENTS: Student[] = [];
export const DEFAULT_MARKS: AssessmentMark[] = [];
export const DEFAULT_ACTIVITIES: ActivityLog[] = [];

export const ASSESSMENT_TEMPLATES = [
  { index: 1, label: 'Quiz 1' },
  { index: 2, label: 'Assignment 1' },
  { index: 3, label: 'Midterm Exam' },
  { index: 4, label: 'Lab Evaluation' },
  { index: 5, label: 'Seminar' },
  { index: 6, label: 'Final Exam' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  splashEffectEnabled: true,
  tiltEffectsEnabled: true,
  ambientGlowEnabled: true,
  reducedMotionOverride: false,
  defaultMethod: 'lagrange',
  passingPercentage: 60,
  institutionName: 'AcademicTrend',
  academicTerm: 'Current Academic Term',
};
