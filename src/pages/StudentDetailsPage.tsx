import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  FloatingInput,
  GlassButton,
  GlassCard,
} from '../components/GlassPrimitives';
import { useAcademic } from '../context/AcademicContext';
import { Student } from '../types/academic';

interface StudentFormState {
  name: string;
  registerNumber: string;
  subjectName: string;
}

const EMPTY_FORM: StudentFormState = {
  name: '',
  registerNumber: '',
  subjectName: '',
};

export const StudentDetailsPage: React.FC = () => {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    setSelectedStudentId,
    setSelectedSubjectName,
    setActivePage,
    openAddStudentRequested,
    setOpenAddStudentRequested,
  } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(
    () => openAddStudentRequested || students.length === 0
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormState, string>>>({});
  const [savedBanner, setSavedBanner] = useState<{ studentId: string; message: string } | null>(
    null
  );

  useEffect(() => {
    if (openAddStudentRequested) {
      setEditingId(null);
      setForm(EMPTY_FORM);
      setErrors({});
      setIsFormOpen(true);
      setOpenAddStudentRequested(false);
    }
  }, [openAddStudentRequested, setOpenAddStudentRequested]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (student: Student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      registerNumber: student.registerNumber,
      subjectName: student.subjectName,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setErrors({});
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof StudentFormState, string>> = {};
    if (!form.name.trim()) {
      nextErrors.name = 'Student Name is required.';
    }
    if (!form.registerNumber.trim()) {
      nextErrors.registerNumber = 'Register Number is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      registerNumber: form.registerNumber.trim(),
      subjectName: form.subjectName.trim(),
    };

    let savedId = editingId ?? '';
    if (editingId) {
      updateStudent(editingId, payload);
      setSavedBanner({
        studentId: editingId,
        message: `Updated ${payload.name} (${payload.registerNumber}).`,
      });
    } else {
      const created = addStudent(payload);
      savedId = created.id;
      setSavedBanner({
        studentId: created.id,
        message: `Saved ${payload.name} (${payload.registerNumber}). You can now enter assessment marks.`,
      });
    }

    setSelectedStudentId(savedId);
    setSelectedSubjectName(payload.subjectName || 'General');
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-cyan-300/90 mb-1">
            Step 1 · Student Entry
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Student Details
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Add and manage students using only their name, register number, and optional subject name.
          </p>
        </div>

        {!isFormOpen && (
          <GlassButton variant="primary" onClick={openCreateForm}>
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </GlassButton>
        )}
      </div>

      {/* Save Success Message with Workflow Shortcut */}
      {savedBanner && (
        <div
          role="status"
          className="glass-panel-subtle rounded-xl px-4 py-3 text-sm text-cyan-100 border-cyan-400/40 flex flex-wrap items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>{savedBanner.message}</span>
          </span>
          <div className="flex items-center gap-2">
            <GlassButton
              size="sm"
              variant="primary"
              onClick={() => {
                setSelectedStudentId(savedBanner.studentId);
                setActivePage('marks');
              }}
            >
              Enter Marks
            </GlassButton>
            <button
              type="button"
              onClick={() => setSavedBanner(null)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Simple 3-Field Glass Card Form */}
      {isFormOpen && (
        <GlassCard className="p-6 border-cyan-300/30">
          <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-white/[0.08]">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                {editingId ? 'Edit Student Details' : 'Add New Student'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter Student Name and Register Number. Subject Name is optional.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Close student form"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FloatingInput
                id="student-name"
                label="Student Name *"
                placeholder="e.g., Ananya Sharma"
                value={form.name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  if (errors.name) setErrors((ePrev) => ({ ...ePrev, name: undefined }));
                }}
                error={errors.name}
                required
              />
              <FloatingInput
                id="student-register"
                label="Register Number *"
                placeholder="e.g., 24CS042"
                value={form.registerNumber}
                onChange={(e) => {
                  setForm((p) => ({ ...p, registerNumber: e.target.value }));
                  if (errors.registerNumber)
                    setErrors((ePrev) => ({ ...ePrev, registerNumber: undefined }));
                }}
                error={errors.registerNumber}
                required
              />
              <FloatingInput
                id="student-subject"
                label="Subject Name (Optional)"
                placeholder="e.g., Numerical Methods"
                value={form.subjectName}
                onChange={(e) => setForm((p) => ({ ...p, subjectName: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <GlassButton type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary">
                <Plus className="w-4 h-4" />
                <span>Save Student</span>
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Search Bar (shown once at least 1 student exists) */}
      {students.length > 0 && (
        <GlassCard className="p-4">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="search"
              aria-label="Search saved students"
              placeholder="Search by student name, register number, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </GlassCard>
      )}

      {/* Saved Students Clean Table */}
      <GlassCard className="overflow-hidden">
        {students.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-200">
              No students added yet. Add your first student.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Saved students will appear here with quick actions to enter marks, edit, or delete.
            </p>
            {!isFormOpen && (
              <GlassButton size="sm" variant="primary" className="mt-4" onClick={openCreateForm}>
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </GlassButton>
            )}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-300">No students match your search.</p>
            <GlassButton
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </GlassButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs font-medium text-slate-400">
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-4">Register Number</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-sm">
                {filteredStudents.map((stu) => {
                  const isConfirmingDelete = confirmDeleteId === stu.id;

                  return (
                    <tr key={stu.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-5 font-medium text-white">{stu.name}</td>
                      <td className="py-3.5 px-4 font-mono-tabular text-xs text-cyan-200 whitespace-nowrap">
                        {stu.registerNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {stu.subjectName || <span className="text-slate-500">Not specified</span>}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-2">
                            <GlassButton
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                deleteStudent(stu.id);
                                setConfirmDeleteId(null);
                              }}
                            >
                              Confirm
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </GlassButton>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <GlassButton
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedStudentId(stu.id);
                                setSelectedSubjectName(stu.subjectName || 'General');
                                setActivePage('marks');
                              }}
                            >
                              Enter Marks
                            </GlassButton>
                            <button
                              type="button"
                              aria-label={`Edit ${stu.name}`}
                              onClick={() => openEditForm(stu)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] text-slate-300 hover:bg-white/[0.12] hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${stu.name}`}
                              onClick={() => setConfirmDeleteId(stu.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] text-slate-300 hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
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
