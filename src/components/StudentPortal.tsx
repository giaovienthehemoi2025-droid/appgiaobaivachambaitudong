import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  GraduationCap, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Award, 
  Calendar,
  User,
  School,
  ArrowLeft,
  Check,
  ShieldCheck,
  Loader2,
  Mail,
  Copy,
  Share2,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Assignment, ExamVariant, Question, Submission, ClassInfo } from '../types';
import { MathRenderer } from '../lib/mathRenderer';
import { calculateAutoScore } from '../lib/shuffler';
import { StudentResultView } from './StudentResultView';

interface StudentPortalProps {
  assignment: Assignment;
  variantId?: string;
  classes: ClassInfo[];
  onSubmitExam: (submission: Submission) => Promise<void>;
  onExitStudentView?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  assignment,
  variantId,
  classes,
  onSubmitExam,
  onExitStudentView
}) => {
  // Find chosen variant or default to first
  const currentVariant: ExamVariant = useMemo(() => {
    if (variantId) {
      const found = assignment.variants.find(v => v.variantId === variantId);
      if (found) return found;
    }
    return assignment.variants[0];
  }, [assignment, variantId]);

  const questions = currentVariant.questions;

  // STEP 1: Registration fields (3 main + 1 optional email)
  const [hasStarted, setHasStarted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [manualClass, setManualClass] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [dobDay, setDobDay] = useState('15');
  const [dobMonth, setDobMonth] = useState('04');
  const [dobYear, setDobYear] = useState('2008');

  // STEP 2: Exam state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(assignment.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<Submission | null>(null);
  const [showDetailedResultView, setShowDetailedResultView] = useState(false);
  const [copiedReceiptLink, setCopiedReceiptLink] = useState(false);

  // Auto-save key in session/local storage for network safety
  const draftKey = `edunexa_draft_${assignment.id}_${currentVariant.variantId}`;

  // Load draft if previously started
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.studentName) setStudentName(parsed.studentName);
        if (parsed.className) setSelectedClass(parsed.className);
      }
    } catch {
      // Ignore
    }
  }, [draftKey]);

  // Save draft whenever answers change
  useEffect(() => {
    if (hasStarted && Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            answers,
            studentName,
            className: selectedClass || manualClass
          })
        );
      } catch {
        // Ignore
      }
    }
  }, [answers, hasStarted, draftKey, studentName, selectedClass, manualClass]);

  // Countdown timer
  useEffect(() => {
    if (!hasStarted || submissionReceipt) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, submissionReceipt]);

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Target class options from assignment (with fallback to all classes if none matched)
  const targetClasses = useMemo(() => {
    if (!assignment.classIds || assignment.classIds.length === 0) return classes;
    const filtered = classes.filter(c => assignment.classIds.includes(c.id));
    return filtered.length > 0 ? filtered : classes;
  }, [classes, assignment]);

  // Start exam
  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClassName = selectedClass === 'other' ? manualClass.trim() : (selectedClass || manualClass).trim();

    if (!studentName.trim()) {
      alert('Vui lòng nhập Họ và tên của bạn!');
      return;
    }
    if (!finalClassName) {
      alert('Vui lòng chọn hoặc nhập Lớp của bạn!');
      return;
    }

    setHasStarted(true);
  };

  // Answer handler
  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleEssayChange = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Counts
  const answeredCount = useMemo(() => {
    return questions.filter(q => (answers[q.id] || '').trim().length > 0).length;
  }, [questions, answers]);

  const unansweredCount = questions.length - answeredCount;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  // Final Submit
  const handleFinalSubmit = async () => {
    if (isSubmitting) return; // Prevent double submit
    setIsSubmitting(true);

    try {
      // 1. Calculate deterministic score
      const scoreResult = calculateAutoScore(questions, answers);

      // 2. Build unique receipt code
      const receiptCode = `EDX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const finalClassName = selectedClass === 'other' ? manualClass : (selectedClass || manualClass);
      const studentDob = `${dobDay.padStart(2, '0')}/${dobMonth.padStart(2, '0')}/${dobYear}`;

      const status = scoreResult.hasEssay ? 'needs_teacher_grading' : 'graded';
      const initialTotalScore = scoreResult.hasEssay ? scoreResult.mcScore : scoreResult.mcScore;

      const sub: Submission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        assignmentId: assignment.id,
        variantId: currentVariant.variantId,
        variantCode: currentVariant.variantCode,
        studentName: studentName.trim(),
        studentDob,
        className: finalClassName,
        startedAt: new Date(Date.now() - (assignment.durationMinutes * 60 - timeLeft) * 1000).toISOString(),
        submittedAt: new Date().toISOString(),
        status,
        answers,
        multipleChoiceScore: scoreResult.mcScore,
        essayScore: 0,
        totalScore: initialTotalScore,
        receiptCode,
        isVerifiedStudent: true,
        syncedToSheets: false,
        studentEmail: studentEmail.trim() || undefined,
        emailNotificationStatus: studentEmail.trim() ? 'pending' : 'not_configured'
      };

      // 3. Save to Firestore
      await onSubmitExam(sub);

      // Clean local draft
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Ignore
      }

      setSubmissionReceipt(sub);
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Có lỗi khi lưu bài lên hệ thống. Bản nháp đã được giữ lại an toàn, vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];

  // ==========================================
  // VIEW 1: REGISTRATION SCREEN (3 FIELDS)
  // ==========================================
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        {onExitStudentView && (
          <button
            onClick={onExitStudentView}
            className="self-start sm:self-center mb-4 flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại bảng điều khiển Giáo viên</span>
          </button>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-800">
              {assignment.title}
            </h1>
            <div className="flex items-center justify-center space-x-3 text-xs text-slate-500">
              <span className="font-semibold text-blue-600">
                Mã đề: {currentVariant.variantCode}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {assignment.durationMinutes} phút
              </span>
              <span>•</span>
              <span>{questions.length} câu</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleStartExam} className="space-y-4">
            {/* Field 1: Ho va ten */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Minh Quân"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Field 2: Lop */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. Lớp học <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium"
                >
                  <option value="">-- Chọn lớp của bạn --</option>
                  {targetClasses.map(cls => (
                    <option key={cls.id} value={cls.name}>Lớp {cls.name}</option>
                  ))}
                  {assignment.allowManualClass && (
                    <option value="other">Lớp khác (Nhập thủ công)...</option>
                  )}
                </select>
              </div>

              {selectedClass === 'other' && (
                <input
                  type="text"
                  required
                  placeholder="Nhập tên lớp của bạn (Ví dụ: 10A3)"
                  value={manualClass}
                  onChange={e => setManualClass(e.target.value)}
                  className="mt-2 w-full text-sm p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              )}
            </div>

            {/* Field 3: Ngay sinh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. Ngày tháng năm sinh (DD/MM/YYYY) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Ngày"
                  value={dobDay}
                  onChange={e => setDobDay(e.target.value)}
                  className="text-sm p-2.5 text-center border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden"
                />
                <input
                  type="number"
                  min={1}
                  max={12}
                  placeholder="Tháng"
                  value={dobMonth}
                  onChange={e => setDobMonth(e.target.value)}
                  className="text-sm p-2.5 text-center border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden"
                />
                <input
                  type="number"
                  min={1990}
                  max={2025}
                  placeholder="Năm"
                  value={dobYear}
                  onChange={e => setDobYear(e.target.value)}
                  className="text-sm p-2.5 text-center border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dùng để xác thực học sinh và đối chiếu bảng điểm (Không công khai)
              </span>
            </div>

            {/* Optional Field: Email nhan thong bao diem */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Email nhận thông báo kết quả (Không bắt buộc)
                </label>
                <span className="text-[10px] text-blue-600 font-medium">Nhận điểm qua Email</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="hocsinh@gmail.com (hoặc email phụ huynh)"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Hệ thống sẽ gửi email báo điểm và lời nhận xét của thầy cô ngay sau khi hoàn tất chấm bài
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              BẮT ĐẦU LÀM BÀI
            </button>
          </form>

          <div className="text-center text-[11px] text-slate-400">
            Hệ thống EDUNEXA • Không cần đăng nhập Gmail • Tự động lưu bài
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: RECEIPT CONFIRMATION SCREEN
  // ==========================================
  if (submissionReceipt) {
    if (showDetailedResultView) {
      return (
        <StudentResultView
          submission={submissionReceipt}
          assignment={assignment}
          onClose={() => setShowDetailedResultView(false)}
          isStandalonePage={true}
        />
      );
    }

    const isScoreAllowed = assignment.showScoreMode === 'immediate';
    const resultLink = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?view=result&subId=${submissionReceipt.id}`
      : `?view=result&subId=${submissionReceipt.id}`;

    const handleCopyResultLink = () => {
      navigator.clipboard.writeText(resultLink);
      setCopiedReceiptLink(true);
      setTimeout(() => setCopiedReceiptLink(false), 2500);
    };

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-5 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-800">
              NỘP BÀI THÀNH CÔNG!
            </h2>
            <p className="text-xs text-slate-500">
              Bài làm của bạn đã được ghi nhận an toàn vào máy chủ Firestore
            </p>
          </div>

          {/* Receipt Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Mã biên nhận:</span>
              <span className="font-mono font-bold text-blue-700 text-sm">
                {submissionReceipt.receiptCode}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Học sinh:</span>
              <span className="font-semibold text-slate-800">{submissionReceipt.studentName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Lớp:</span>
              <span className="font-semibold text-slate-800">{submissionReceipt.className}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Mã đề:</span>
              <span className="font-semibold text-slate-800">{submissionReceipt.variantCode}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Thời gian nộp:</span>
              <span className="text-slate-700">
                {new Date(submissionReceipt.submittedAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>

            {/* Score view */}
            {isScoreAllowed && (
              <div className="pt-2 border-t border-slate-200 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Điểm trắc nghiệm:</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {submissionReceipt.multipleChoiceScore} điểm
                  </span>
                </div>
                {submissionReceipt.status === 'needs_teacher_grading' && (
                  <span className="text-[11px] text-amber-600 block mt-1">
                    * Phần tự luận đang chờ giáo viên chấm và sẽ cập nhật tổng điểm sau.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SHAREABLE RESULT LINK SECTION */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                Link dẫn đến kết quả bài làm:
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Lưu đối chiếu</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                readOnly
                value={resultLink}
                className="w-full text-xs font-mono p-2 bg-white border border-blue-200 rounded-lg text-slate-700 select-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyResultLink}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0 shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
              >
                {copiedReceiptLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReceiptLink ? 'Đã chép' : 'Chép link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Học sinh & phụ huynh có thể mở link này bất cứ lúc nào để xem điểm và nhận xét của thầy cô.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setShowDetailedResultView(true)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>XEM CHI TIẾT KẾT QUẢ & BÀI LÀM</span>
            </button>

            {onExitStudentView && (
              <button
                type="button"
                onClick={onExitStudentView}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Quay lại Bảng điều khiển
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MOBILE-FIRST EXAM SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Sticky Exam Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xs sm:text-sm text-slate-800 truncate max-w-[160px] sm:max-w-xs">
              {studentName} ({selectedClass || manualClass})
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
              Đề {currentVariant.variantCode}
            </span>
          </div>

          {/* Countdown Clock */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            timeLeft < 300 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>NỘP BÀI</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col gap-4">
        {/* Question Navigation Chips */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span>Tiến độ: {answeredCount}/{questions.length} câu ({progressPercent}%)</span>
            <span className="text-[11px] text-slate-400">Chạm số câu để chuyển nhanh</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = (answers[q.id] || '').trim().length > 0;
              const isCurrent = idx === currentQuestionIndex;
              const isFlagged = flaggedQuestions[q.id];

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {q.number}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question Card */}
        {currentQ && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold text-blue-600">
                    Câu {currentQ.number} / {questions.length}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({currentQ.points} điểm)
                  </span>
                </div>

                <button
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    flaggedQuestions[currentQ.id]
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQ.id] ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                </button>
              </div>

              {/* Question Content (with KaTeX rendering) */}
              <div className="text-slate-900 text-sm sm:text-base font-medium leading-relaxed">
                <MathRenderer content={currentQ.questionText} />
              </div>

              {/* Multiple Choice Options (4 Big Touch Cards) */}
              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt.id)}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-center space-x-3 transition-all cursor-pointer active:scale-[0.99] ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold ring-1 ring-blue-600 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700'
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="flex-1 text-sm">
                          <MathRenderer content={opt.text} />
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Essay / Text Answer Area */
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Bài làm tự luận của bạn (tự động lưu nháp):
                  </label>
                  <textarea
                    rows={6}
                    value={answers[currentQ.id] || ''}
                    onChange={e => handleEssayChange(currentQ.id, e.target.value)}
                    placeholder="Nhập câu trả lời chi tiết hoặc các bước giải toán của bạn tại đây..."
                    className="w-full text-sm p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Bottom Next / Prev Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <div className="text-xs text-slate-400 font-medium">
                {currentQuestionIndex + 1} / {questions.length}
              </div>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="flex items-center space-x-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Câu tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center space-x-1 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Xem nộp bài</span>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-800 text-center">
              Xác nhận nộp bài thi
            </h4>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Số câu đã làm:</span>
                <span className="font-bold text-emerald-600">{answeredCount} câu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số câu chưa làm:</span>
                <span className={`font-bold ${unansweredCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                  {unansweredCount} câu
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian còn lại:</span>
                <span className="font-bold text-slate-700">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Bạn vẫn còn {unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài bây giờ không?
              </p>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="w-1/2 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>NỘP NGAY</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
