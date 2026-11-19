export type PageId =
  | 'dashboard'
  | 'students'
  | 'marks'
  | 'interpolation'
  | 'analysis'
  | 'reports'
  | 'settings';

export type InterpolationMethod =
  | 'lagrange'
  | 'newton'
  | 'spline'
  | 'linear';

export interface Student {
  id: string;
  name: string;
  registerNumber: string;
  subjectName: string; // Optional text entered by user (may be empty string)
  createdAt: string;
}

export interface AssessmentMark {
  id: string;
  studentId: string;
  subjectName: string;
  assessmentIndex: number;
  assessmentLabel: string;
  score: number | null; // null represents a missing assessment mark to interpolate
  maxScore: number;
  date: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'student_added' | 'student_updated' | 'marks_saved' | 'interpolation_run' | 'report_exported';
  title: string;
  detail: string;
}

export interface InterpolationPoint {
  x: number;
  y: number;
  label: string;
}

export interface InterpolationStep {
  stepNumber: number;
  title: string;
  expression: string;
  value?: string;
}

export interface DividedDifferenceRow {
  x: number;
  y: number;
  differences: number[];
}

export interface InterpolationResult {
  method: InterpolationMethod;
  targetX: number;
  rawEstimate: number;
  clampedEstimate: number;
  isClamped: boolean;
  isExtrapolation: boolean;
  confidenceLabel: string;
  formulaTitle: string;
  formulaEquation: string;
  formulaDescription: string;
  steps: InterpolationStep[];
  dividedDifferenceTable?: DividedDifferenceRow[];
  knownPoints: InterpolationPoint[];
  curveSamples: Array<{ x: number; estimated: number; actual: number | null }>;
}

export interface AppSettings {
  splashEffectEnabled: boolean;
  tiltEffectsEnabled: boolean;
  ambientGlowEnabled: boolean;
  reducedMotionOverride: boolean;
  defaultMethod: InterpolationMethod;
  passingPercentage: number;
  institutionName: string;
  academicTerm: string;
}
