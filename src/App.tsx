import React, { useState, useEffect } from 'react';
import { 
  fetchClasses, 
  fetchMatrices, 
  fetchExams, 
  fetchAssignments, 
  fetchAllSubmissions, 
  getTeacherSetting,
  saveClass, 
  deleteClass, 
  saveMatrix, 
  saveExam, 
  deleteExam, 
  saveAssignment, 
  submitStudentExam, 
  updateSubmissionGrading, 
  saveTeacherSetting, 
  ensureTeacherAuth,
  testConnection,
  fetchTextbooks,
  saveTextbook,
  deleteTextbook,
  fetchSubmissionById
} from './lib/firebase';
import { StudentResultView } from './components/StudentResultView';
import { 
  ClassInfo, 
  Matrix, 
  Exam, 
  Assignment, 
  Submission, 
  TeacherSetting,
  TextbookPdf 
} from './types';
import { 
  DEFAULT_TEACHER_SETTING, 
  INITIAL_CLASSES, 
  INITIAL_MATRIX, 
  INITIAL_EXAM, 
  INITIAL_ASSIGNMENT, 
  INITIAL_SUBMISSIONS,
  INITIAL_TEXTBOOKS 
} from './lib/seedData';
import { Header } from './components/Header';
import { Navigation, MainTab } from './components/Navigation';
import { ModuleOverview } from './components/ModuleOverview';
import { ModuleRepository } from './components/ModuleRepository';
import { ModuleMatrix } from './components/ModuleMatrix';
import { ModuleAssign } from './components/ModuleAssign';
import { ModuleSubmissions } from './components/ModuleSubmissions';
import { StudentPortal } from './components/StudentPortal';
import { ClassModal } from './components/ClassModal';
import { SettingsModal } from './components/SettingsModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data States
  const [teacherSetting, setTeacherSetting] = useState<TeacherSetting>(DEFAULT_TEACHER_SETTING);
  const [classes, setClasses] = useState<ClassInfo[]>(INITIAL_CLASSES);
  const [matrices, setMatrices] = useState<Matrix[]>([INITIAL_MATRIX]);
  const [exams, setExams] = useState<Exam[]>([INITIAL_EXAM]);
  const [assignments, setAssignments] = useState<Assignment[]>([INITIAL_ASSIGNMENT]);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [textbooks, setTextbooks] = useState<TextbookPdf[]>([]);

  // Interaction State
  const [selectedExamForAssign, setSelectedExamForAssign] = useState<Exam | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Student portal routing
  const [studentMode, setStudentMode] = useState<{
    active: boolean;
    assignmentId?: string;
    variantId?: string;
  }>({ active: false });

  // Direct student result viewer routing (?view=result&subId=...)
  const [directResultMode, setDirectResultMode] = useState<{
    active: boolean;
    submissionId?: string;
  } | null>(null);

  // On App Mount: check URL parameters and load data
  useEffect(() => {
    let isMounted = true;

    // Safety fallback: Unblock loading screen within 1.2s at most so the app never hangs
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 1200);

    const initApp = async () => {
      // 1. Check URL for student exam mode or direct result mode
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const asgId = urlParams.get('assignmentId');
        const varId = urlParams.get('variantId');
        const subId = urlParams.get('subId');
        const view = urlParams.get('view');

        if (view === 'result' || subId) {
          setDirectResultMode({
            active: true,
            submissionId: subId || undefined
          });
        } else if (asgId) {
          setStudentMode({
            active: true,
            assignmentId: asgId,
            variantId: varId || undefined
          });
        }
      }

      // 2. Authenticate & load from Firestore in parallel without blocking
      try {
        const user = await ensureTeacherAuth(1500);
        const teacherId = user.uid || 'teacher_default_edunexa';

        // Fetch all collections in parallel with Promise.allSettled
        const [settingsRes, classesRes, matricesRes, examsRes, asgsRes, subsRes, booksRes] = await Promise.allSettled([
          getTeacherSetting(teacherId),
          fetchClasses(teacherId),
          fetchMatrices(teacherId),
          fetchExams(teacherId),
          fetchAssignments(teacherId),
          fetchAllSubmissions(),
          fetchTextbooks()
        ]);

        if (!isMounted) return;

        // Settings
        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          setTeacherSetting(settingsRes.value);
        } else {
          saveTeacherSetting({ ...DEFAULT_TEACHER_SETTING, teacherId }).catch(() => {});
        }

        // Classes
        if (classesRes.status === 'fulfilled' && classesRes.value.length > 0) {
          setClasses(classesRes.value);
        } else {
          // Asynchronous background seed without blocking UI
          Promise.all(INITIAL_CLASSES.map(c => saveClass({ ...c, teacherId }))).catch(() => {});
        }

        // Matrices
        if (matricesRes.status === 'fulfilled' && matricesRes.value.length > 0) {
          setMatrices(matricesRes.value);
        } else {
          saveMatrix({ ...INITIAL_MATRIX, teacherId }).catch(() => {});
        }

        // Exams
        if (examsRes.status === 'fulfilled' && examsRes.value.length > 0) {
          setExams(examsRes.value);
        } else {
          saveExam({ ...INITIAL_EXAM, teacherId }).catch(() => {});
        }

        // Assignments
        if (asgsRes.status === 'fulfilled' && asgsRes.value.length > 0) {
          setAssignments(asgsRes.value);
        } else {
          saveAssignment({ ...INITIAL_ASSIGNMENT, teacherId }).catch(() => {});
        }

        // Submissions
        if (subsRes.status === 'fulfilled' && subsRes.value.length > 0) {
          setSubmissions(subsRes.value);
        } else {
          Promise.all(INITIAL_SUBMISSIONS.map(s => submitStudentExam(s))).catch(() => {});
        }

        // Textbooks (Starts clean without pre-seeded books, strictly deduplicated by id)
        if (booksRes.status === 'fulfilled' && booksRes.value.length > 0) {
          const DEFAULT_PRESEED_IDS = [
            'sgk_toan_10_kntt', 
            'sgk_van_10_cd', 
            'sgk_anh_10_gs', 
            'sgk_vat_li_11_kntt', 
            'sgk_khtn_8_ctst', 
            'sgk_tin_10_cd'
          ];
          const DEFAULT_PRESEED_TITLES = [
            'Sách giáo khoa Toán 10 - Tập 1', 
            'Sách giáo khoa Ngữ văn 10 - Tập 1', 
            'Tiếng Anh 10 - Global Success', 
            'Sách giáo khoa Vật lí 11', 
            'Khoa học tự nhiên 8', 
            'Sách giáo khoa Tin học 10 (Định hướng Tin học ứng dụng & KH Máy tính)'
          ];

          const userBooksMap = new Map<string, TextbookPdf>();
          booksRes.value.forEach(b => {
            if (
              b && 
              b.id && 
              !DEFAULT_PRESEED_IDS.includes(b.id) && 
              !DEFAULT_PRESEED_TITLES.includes(b.title)
            ) {
              userBooksMap.set(b.id, b);
            } else if (b?.id) {
              deleteTextbook(b.id).catch(() => {});
            }
          });
          setTextbooks(Array.from(userBooksMap.values()));
        } else {
          setTextbooks([]);
        }
      } catch (err) {
        console.warn('Init notice (using instant local seed):', err);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setIsLoading(false);
        }
      }
    };

    initApp();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Handlers for Firestore operations
  const handleSaveClass = async (cls: ClassInfo) => {
    try {
      await saveClass(cls);
    } catch {
      // Ignore
    }
    setClasses(prev => {
      const idx = prev.findIndex(c => c.id === cls.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cls;
        return next;
      }
      return [...prev, cls];
    });
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteClass(classId);
    } catch {
      // Ignore
    }
    setClasses(prev => prev.filter(c => c.id !== classId));
  };

  const handleSaveMatrix = async (matrix: Matrix) => {
    try {
      await saveMatrix(matrix);
    } catch {
      // Ignore
    }
    setMatrices(prev => {
      const idx = prev.findIndex(m => m.id === matrix.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = matrix;
        return next;
      }
      return [...prev, matrix];
    });
  };

  const handleSaveExam = async (exam: Exam) => {
    try {
      await saveExam(exam);
    } catch {
      // Ignore
    }
    setExams(prev => {
      const idx = prev.findIndex(e => e.id === exam.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = exam;
        return next;
      }
      return [exam, ...prev];
    });
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam(examId);
    } catch {
      // Ignore
    }
    setExams(prev => prev.filter(e => e.id !== examId));
  };

  const handleSaveAssignment = async (assignment: Assignment) => {
    try {
      await saveAssignment(assignment);
    } catch {
      // Ignore
    }
    setAssignments(prev => [assignment, ...prev]);
  };

  const handleStudentSubmit = async (submission: Submission) => {
    try {
      await submitStudentExam(submission);
    } catch {
      // Ignore
    }
    setSubmissions(prev => [submission, ...prev]);
  };

  const handleGradeSubmission = async (
    submissionId: string, 
    essayScore: number, 
    totalScore: number, 
    feedback: string
  ) => {
    try {
      await updateSubmissionGrading(
        submissionId,
        essayScore,
        totalScore,
        feedback,
        teacherSetting.teacherName
      );
    } catch {
      // Ignore
    }
    setSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        return {
          ...s,
          essayScore,
          totalScore,
          teacherFeedback: feedback,
          status: 'graded',
          gradedBy: teacherSetting.teacherName
        };
      }
      return s;
    }));
  };

  const handleSaveSetting = async (setting: TeacherSetting) => {
    try {
      await saveTeacherSetting(setting);
    } catch {
      // Ignore
    }
    setTeacherSetting(setting);
  };

  const handleSaveTextbook = async (book: TextbookPdf) => {
    try {
      await saveTextbook(book);
    } catch {
      // Ignore
    }
    setTextbooks(prev => {
      const map = new Map<string, TextbookPdf>();
      prev.forEach(b => { if (b?.id) map.set(b.id, b); });
      map.set(book.id, book);
      return Array.from(map.values());
    });
  };

  const handleDeleteTextbook = async (bookId: string) => {
    try {
      await deleteTextbook(bookId);
    } catch {
      // Ignore
    }
    setTextbooks(prev => prev.filter(b => b.id !== bookId));
  };

  // Switch to Assign tab with selected exam
  const handleSelectExamForAssignment = (exam: Exam) => {
    setSelectedExamForAssign(exam);
    setCurrentTab('assign');
  };

  // Open student view preview
  const handleOpenStudentPreview = (asgId?: string, varId?: string) => {
    let targetAsg = assignments.find(a => a.id === asgId) || assignments[0];
    if (!targetAsg) {
      targetAsg = INITIAL_ASSIGNMENT;
      setAssignments([INITIAL_ASSIGNMENT]);
    }
    setStudentMode({
      active: true,
      assignmentId: targetAsg.id,
      variantId: varId || targetAsg.variants?.[0]?.variantId
    });
  };

  const pendingEssayCount = submissions.filter(s => s.status === 'needs_teacher_grading').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Đang khởi động EDUNEXA 1.0...</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">Đang kết nối Firestore và chuẩn bị học liệu</p>
        <button
          onClick={() => setIsLoading(false)}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          Vào ứng dụng ngay
        </button>
      </div>
    );
  }

  // ==========================================
  // DIRECT STUDENT RESULT VIEW
  // ==========================================
  if (directResultMode?.active) {
    const targetSubmission = submissions.find(s => s.id === directResultMode.submissionId) || submissions[0];
    if (targetSubmission) {
      const targetAssignment = assignments.find(a => a.id === targetSubmission.assignmentId) || assignments[0];
      const targetExam = exams.find(e => e.id === targetAssignment?.examId);
      return (
        <StudentResultView
          submission={targetSubmission}
          assignment={targetAssignment}
          exam={targetExam}
          isStandalonePage={true}
          onClose={() => {
            if (typeof window !== 'undefined' && window.history) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            setDirectResultMode(null);
          }}
        />
      );
    }
  }

  // ==========================================
  // STUDENT PORTAL VIEW
  // ==========================================
  if (studentMode.active) {
    const targetAssignment = assignments.find(a => a.id === studentMode.assignmentId) || assignments[0] || INITIAL_ASSIGNMENT;
    if (targetAssignment) {
      return (
        <StudentPortal
          assignment={targetAssignment}
          variantId={studentMode.variantId}
          classes={classes}
          onSubmitExam={handleStudentSubmit}
          onExitStudentView={() => {
            // Remove params from URL and exit
            if (typeof window !== 'undefined' && window.history) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            setStudentMode({ active: false });
          }}
        />
      );
    }
  }

  // ==========================================
  // TEACHER PORTAL VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        teacherSetting={teacherSetting}
        onOpenClassManager={() => setIsClassModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenStudentPreview={() => handleOpenStudentPreview()}
      />

      {/* 5 Core Tabs Navigation */}
      <Navigation
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        pendingEssayCount={pendingEssayCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {currentTab === 'overview' && (
          <ModuleOverview
            assignments={assignments}
            submissions={submissions}
            classes={classes}
            exams={exams}
            teacherSetting={teacherSetting}
            onGradeSubmission={handleGradeSubmission}
            onSimulateNewSubmission={handleStudentSubmit}
            onNavigateToTab={setCurrentTab}
            onOpenClassManager={() => setIsClassModalOpen(true)}
          />
        )}

        {currentTab === 'repository' && (
          <ModuleRepository
            exams={exams}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
            onSelectExamForAssignment={handleSelectExamForAssignment}
            onNavigateToMatrix={() => setCurrentTab('matrix')}
            textbooks={textbooks}
            onSaveTextbook={handleSaveTextbook}
            onDeleteTextbook={handleDeleteTextbook}
          />
        )}

        {currentTab === 'matrix' && (
          <ModuleMatrix
            matrices={matrices}
            onSaveMatrix={handleSaveMatrix}
            onSaveExam={handleSaveExam}
            onProceedToAssign={handleSelectExamForAssignment}
          />
        )}

        {currentTab === 'assign' && (
          <ModuleAssign
            exams={exams}
            classes={classes}
            assignments={assignments}
            selectedExamForAssign={selectedExamForAssign}
            onSaveAssignment={handleSaveAssignment}
            onOpenStudentExam={(asgId, varId) => handleOpenStudentPreview(asgId, varId)}
          />
        )}

        {currentTab === 'submissions' && (
          <ModuleSubmissions
            submissions={submissions}
            assignments={assignments}
            exams={exams}
            teacherSetting={teacherSetting}
            onGradeSubmission={handleGradeSubmission}
            onOpenSheetsModal={() => setIsSettingsModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          EDUNEXA AI GIAO BÀI & CHẤM BÀI 1.0 • Nền tảng khảo thí chuẩn Bộ GD&ĐT cho Giáo viên Việt Nam
        </p>
      </footer>

      {/* Modals */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        classes={classes}
        onSaveClass={handleSaveClass}
        onDeleteClass={handleDeleteClass}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        setting={teacherSetting}
        submissions={submissions}
        onSaveSetting={handleSaveSetting}
      />
    </div>
  );
}
