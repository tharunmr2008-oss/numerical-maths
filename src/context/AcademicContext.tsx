import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_MARKS,
  DEFAULT_SETTINGS,
  DEFAULT_STUDENTS,
} from '../data/seedData';
import {
  ActivityLog,
  AppSettings,
  AssessmentMark,
  PageId,
  Student,
} from '../types/academic';

const STORAGE_KEYS = {
  students: 'academictrend_v3_students',
  marks: 'academictrend_v3_marks',
  activities: 'academictrend_v3_activities',
  analysesCount: 'academictrend_v3_analyses_count',
  settings: 'academictrend_v3_settings',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface AcademicContextValue {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  openAddStudentRequested: boolean;
  setOpenAddStudentRequested: (open: boolean) => void;
  navigateToAddStudent: () => void;
  students: Student[];
  marks: AssessmentMark[];
  activities: ActivityLog[];
  analysesCount: number;
  settings: AppSettings;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  selectedSubjectName: string;
  setSelectedSubjectName: (subject: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Student;
  updateStudent: (id: string, patch: Partial<Omit<Student, 'id' | 'createdAt'>>) => void;
  deleteStudent: (id: string) => void;
  upsertMarksForPair: (
    studentId: string,
    subjectName: string,
    entries: Array<{
      id?: string;
      assessmentIndex: number;
      assessmentLabel: string;
      score: number | null;
      maxScore: number;
      date: string;
    }>
  ) => void;
  recordAnalysisRun: (title: string, detail: string) => void;
  logActivity: (type: ActivityLog['type'], title: string, detail: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  clearAllData: () => void;
}

const AcademicContext = createContext<AcademicContextValue | null>(null);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [openAddStudentRequested, setOpenAddStudentRequested] = useState(false);

  const [students, setStudents] = useState<Student[]>(() =>
    loadFromStorage(STORAGE_KEYS.students, DEFAULT_STUDENTS)
  );
  const [marks, setMarks] = useState<AssessmentMark[]>(() =>
    loadFromStorage(STORAGE_KEYS.marks, DEFAULT_MARKS)
  );
  const [activities, setActivities] = useState<ActivityLog[]>(() =>
    loadFromStorage(STORAGE_KEYS.activities, DEFAULT_ACTIVITIES)
  );
  const [analysesCount, setAnalysesCount] = useState<number>(() =>
    loadFromStorage(STORAGE_KEYS.analysesCount, 0)
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    () => students[0]?.id ?? ''
  );
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(
    () => students[0]?.subjectName ?? ''
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
    } catch {
      // Ignore storage quota errors
    }
  }, [students]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.marks, JSON.stringify(marks));
    } catch {
      // Ignore storage quota errors
    }
  }, [marks]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities));
    } catch {
      // Ignore storage quota errors
    }
  }, [activities]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.analysesCount, JSON.stringify(analysesCount));
    } catch {
      // Ignore storage quota errors
    }
  }, [analysesCount]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  const navigateToAddStudent = () => {
    setOpenAddStudentRequested(true);
    setActivePage('students');
  };

  const logActivity = (type: ActivityLog['type'], title: string, detail: string) => {
    const newEntry: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      detail,
    };
    setActivities((prev) => [newEntry, ...prev].slice(0, 24));
  };

  const addStudent = (input: Omit<Student, 'id' | 'createdAt'>): Student => {
    const created: Student = {
      ...input,
      id: `stu-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setStudents((prev) => [created, ...prev]);
    setSelectedStudentId(created.id);
    setSelectedSubjectName(created.subjectName || 'General');
    logActivity(
      'student_added',
      `Added student ${created.name}`,
      `${created.registerNumber}${created.subjectName ? ` · ${created.subjectName}` : ''}`
    );
    return created;
  };

  const updateStudent = (id: string, patch: Partial<Omit<Student, 'id' | 'createdAt'>>) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    logActivity(
      'student_updated',
      `Updated ${patch.name ?? target?.name ?? 'student'}`,
      `${patch.registerNumber ?? target?.registerNumber ?? ''}${(patch.subjectName ?? target?.subjectName) ? ` · ${patch.subjectName ?? target?.subjectName}` : ''}`
    );
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    const remaining = students.filter((s) => s.id !== id);
    setStudents(remaining);
    setMarks((prev) => prev.filter((m) => m.studentId !== id));
    if (selectedStudentId === id) {
      setSelectedStudentId(remaining[0]?.id ?? '');
      setSelectedSubjectName(remaining[0]?.subjectName ?? '');
    }
    if (target) {
      logActivity(
        'student_updated',
        `Removed ${target.name}`,
        `${target.registerNumber} · Student record deleted`
      );
    }
  };

  const upsertMarksForPair = (
    studentId: string,
    subjectName: string,
    entries: Array<{
      id?: string;
      assessmentIndex: number;
      assessmentLabel: string;
      score: number | null;
      maxScore: number;
      date: string;
    }>
  ) => {
    const cleanSubject = subjectName.trim() || 'General';
    setMarks((prev) => {
      const others = prev.filter(
        (m) =>
          !(
            m.studentId === studentId &&
            m.subjectName.trim().toLowerCase() === cleanSubject.toLowerCase()
          )
      );
      const updated: AssessmentMark[] = entries
        .slice()
        .sort((a, b) => a.assessmentIndex - b.assessmentIndex)
        .map((entry, idx) => ({
          id: entry.id || `mk-${studentId}-${entry.assessmentIndex}-${Date.now()}-${idx}`,
          studentId,
          subjectName: cleanSubject,
          assessmentIndex: entry.assessmentIndex,
          assessmentLabel: entry.assessmentLabel,
          score: entry.score,
          maxScore: entry.maxScore,
          date: entry.date,
        }));
      return [...others, ...updated];
    });

    const student = students.find((s) => s.id === studentId);
    logActivity(
      'marks_saved',
      `Saved ${entries.length} marks for ${student?.name ?? 'Student'}`,
      cleanSubject
    );
  };

  const recordAnalysisRun = (title: string, detail: string) => {
    setAnalysesCount((c) => c + 1);
    logActivity('interpolation_run', title, detail);
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const clearAllData = () => {
    setStudents([]);
    setMarks([]);
    setActivities([]);
    setAnalysesCount(0);
    setSelectedStudentId('');
    setSelectedSubjectName('');
  };

  return (
    <AcademicContext.Provider
      value={{
        activePage,
        setActivePage,
        openAddStudentRequested,
        setOpenAddStudentRequested,
        navigateToAddStudent,
        students,
        marks,
        activities,
        analysesCount,
        settings,
        selectedStudentId,
        setSelectedStudentId,
        selectedSubjectName,
        setSelectedSubjectName,
        addStudent,
        updateStudent,
        deleteStudent,
        upsertMarksForPair,
        recordAnalysisRun,
        logActivity,
        updateSettings,
        clearAllData,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export function useAcademic(): AcademicContextValue {
  const ctx = useContext(AcademicContext);
  if (!ctx) {
    throw new Error('useAcademic must be used inside AcademicProvider');
  }
  return ctx;
}
