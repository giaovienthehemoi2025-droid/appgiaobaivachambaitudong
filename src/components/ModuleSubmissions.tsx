import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Clock, 
  FileSpreadsheet, 
  Filter, 
  Eye, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Share2, 
  Loader2,
  Check,
  Search,
  Mail,
  Send,
  History,
  X,
  ExternalLink,
  Link2,
  Copy
} from 'lucide-react';
import { Submission, Assignment, Exam, Question, TeacherSetting, EmailNotificationRecord } from '../types';
import { MathRenderer } from '../lib/mathRenderer';
import { exportSubmissionsToExcel } from '../lib/excelExport';
import { exportToSheet } from '../lib/googleSheets';
import { StudentResultView } from './StudentResultView';
import { 
  sendGradedNotificationEmail, 
  generateScoreReportEmailHtml, 
  getEmailNotificationLogs,
  clearEmailNotificationLogs
} from '../lib/emailNotification';

interface ModuleSubmissionsProps {
  submissions: Submission[];
  assignments: Assignment[];
  exams: Exam[];
  teacherSetting?: TeacherSetting;
  onGradeSubmission: (
    submissionId: string, 
    essayScore: number, 
    totalScore: number, 
    feedback: string
  ) => Promise<void>;
  onOpenSheetsModal: () => void;
}

export const ModuleSubmissions: React.FC<ModuleSubmissionsProps> = ({
  submissions,
  assignments,
  exams,
  teacherSetting,
  onGradeSubmission,
  onOpenSheetsModal
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'graded'>('all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Selected submission for grading modal / drawer
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [inputEssayScore, setInputEssayScore] = useState<number>(0);
  const [inputFeedback, setInputFeedback] = useState<string>('');
  const [isAiGrading, setIsAiGrading] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestedScore: number; feedback: string } | null>(null);

  // Email Notification States
  const [sendEmailOnSave, setSendEmailOnSave] = useState<boolean>(true);
  const [recipientEmailInput, setRecipientEmailInput] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatusToast, setEmailStatusToast] = useState<string | null>(null);

  // Preview Email Modal State
  const [previewingEmailSub, setPreviewingEmailSub] = useState<Submission | null>(null);

  // Email Logs History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [emailLogs, setEmailLogs] = useState<EmailNotificationRecord[]>([]);

  // Student Result Modal & Link Sharing State
  const [selectedResultSub, setSelectedResultSub] = useState<Submission | null>(null);
  const [copiedSubId, setCopiedSubId] = useState<string | null>(null);

  const handleCopyResultLink = (sub: Submission) => {
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?view=result&subId=${sub.id}`
      : `?view=result&subId=${sub.id}`;
    navigator.clipboard.writeText(link);
    setCopiedSubId(sub.id);
    setTimeout(() => setCopiedSubId(null), 2500);
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      if (selectedAssignmentId !== 'all' && sub.assignmentId !== selectedAssignmentId) return false;
      if (selectedClass !== 'all' && sub.className !== selectedClass) return false;
      if (activeTab === 'pending' && sub.status !== 'needs_teacher_grading') return false;
      if (activeTab === 'graded' && sub.status !== 'graded') return false;
      if (searchStudent.trim() && !sub.studentName.toLowerCase().includes(searchStudent.toLowerCase())) return false;
      return true;
    });
  }, [submissions, selectedAssignmentId, selectedClass, activeTab, searchStudent]);

  // Unique classes from submissions
  const availableClasses = useMemo(() => {
    const set = new Set(submissions.map(s => s.className));
    return Array.from(set);
  }, [submissions]);

  // Get current assignment and exam for the submission being graded
  const currentAssignment = assignments.find(a => a.id === gradingSubmission?.assignmentId);
  const currentExam = exams.find(e => e.id === currentAssignment?.examId);

  // Open grading modal
  const handleOpenGrading = (sub: Submission) => {
    setGradingSubmission(sub);
    setInputEssayScore(sub.essayScore || 0);
    setInputFeedback(sub.teacherFeedback || '');
    setAiSuggestion(null);
    setRecipientEmailInput(sub.studentEmail || '');
    setSendEmailOnSave(true);
  };

  // AI Essay Grading Helper
  const handleRequestAiGrade = async (question: Question, studentAnswer: string) => {
    setIsAiGrading(true);
    try {
      const res = await fetch('/api/ai/grade-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.questionText,
          studentAnswer,
          rubric: question.explanation || '',
          maxPoints: question.points
        })
      });
      const data = await res.json();
      setAiSuggestion(data);
      setInputEssayScore(data.suggestedScore);
      setInputFeedback(data.feedback);
    } catch (err) {
      console.error('AI grading error:', err);
    } finally {
      setIsAiGrading(false);
    }
  };

  // Confirm Teacher Grading & Send Automated Email
  const handleSaveTeacherGrading = async () => {
    if (!gradingSubmission) return;
    const finalTotalScore = Math.round((gradingSubmission.multipleChoiceScore + inputEssayScore) * 100) / 100;
    
    // 1. Update grading in Firestore / state
    await onGradeSubmission(
      gradingSubmission.id,
      inputEssayScore,
      finalTotalScore,
      inputFeedback
    );

    // 2. Dispatch automated email notification if enabled
    if (sendEmailOnSave) {
      setIsSendingEmail(true);
      try {
        const examTitle = currentAssignment?.title || 'Bài kiểm tra EDUNEXA';
        const res = await sendGradedNotificationEmail({
          submission: {
            ...gradingSubmission,
            essayScore: inputEssayScore,
            totalScore: finalTotalScore,
            teacherFeedback: inputFeedback,
            studentEmail: recipientEmailInput || gradingSubmission.studentEmail
          },
          examTitle,
          teacherSetting: teacherSetting || {
            id: 'setting_default',
            teacherId: 'teacher_default_edunexa',
            teacherName: 'Thầy Nguyễn Văn An',
            schoolName: 'THPT Chuyên Chu Văn An',
            autoSyncSheets: false,
            updatedAt: new Date().toISOString()
          },
          customRecipientEmail: recipientEmailInput
        });

        setEmailStatusToast(res.message);
        setTimeout(() => setEmailStatusToast(null), 4000);
      } catch (err: any) {
        console.error('Send email error:', err);
      } finally {
        setIsSendingEmail(false);
      }
    }

    // 3. Tự động cập nhật điểm lên Google Sheets / Excel nếu đã cấu hình
    if (teacherSetting?.sheetsSpreadsheetId) {
      exportToSheet(
        teacherSetting.sheetsSpreadsheetId,
        currentAssignment?.title || 'Bài kiểm tra EDUNEXA',
        [
          {
            ...gradingSubmission,
            essayScore: inputEssayScore,
            totalScore: finalTotalScore,
            teacherFeedback: inputFeedback,
            status: 'graded'
          }
        ],
        currentExam?.questions || []
      ).then(res => {
        if (res.syncedCount > 0) {
          setEmailStatusToast(prev => prev ? `${prev} • ${res.message}` : `✓ ${res.message}`);
          setTimeout(() => setEmailStatusToast(null), 5000);
        }
      }).catch(err => {
        console.warn('Auto-sync to sheets note:', err);
      });
    }

    setGradingSubmission(null);
  };

  // One-click send or resend email notification directly from table
  const handleDirectSendEmail = async (sub: Submission) => {
    setIsSendingEmail(true);
    try {
      const asg = assignments.find(a => a.id === sub.assignmentId);
      const res = await sendGradedNotificationEmail({
        submission: sub,
        examTitle: asg?.title || 'Bài kiểm tra EDUNEXA',
        teacherSetting: teacherSetting || {
          id: 'setting_default',
          teacherId: 'teacher_default_edunexa',
          teacherName: 'Thầy Nguyễn Văn An',
          schoolName: 'THPT Chuyên Chu Văn An',
          autoSyncSheets: false,
          updatedAt: new Date().toISOString()
        }
      });
      setEmailStatusToast(res.message);
      setTimeout(() => setEmailStatusToast(null), 4000);
    } catch (err: any) {
      alert('Không thể gửi email: ' + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Open email logs modal
  const handleOpenEmailLogs = () => {
    setEmailLogs(getEmailNotificationLogs());
    setIsHistoryModalOpen(true);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const title = selectedAssignmentId !== 'all' 
      ? (assignments.find(a => a.id === selectedAssignmentId)?.title || 'KetQua')
      : 'TatCaBaiTap';
    exportSubmissionsToExcel(title, filteredSubmissions, currentExam?.questions || []);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {emailStatusToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{emailStatusToast}</span>
          </div>
          <button onClick={() => setEmailStatusToast(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Bước 5: Khảo Thí & Chấm Điểm
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Chấm Bài & Cập Nhật Google Sheets / Excel
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trắc nghiệm tự động chấm 100% khi học sinh nộp • Giáo viên duyệt chấm tự luận • Tự động đồng bộ Google Sheets & Xuất Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenEmailLogs}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="Xem danh sách email đã tự động gửi đến học sinh"
          >
            <History className="w-4 h-4" />
            <span>Lịch sử Email ({getEmailNotificationLogs().length})</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất kết quả Excel (.xlsx)</span>
          </button>

          <button
            onClick={onOpenSheetsModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Đồng bộ Google Sheets</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg space-x-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả bài nộp ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Chờ chấm tự luận ({submissions.filter(s => s.status === 'needs_teacher_grading').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('graded')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'graded'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đã chấm hoàn tất ({submissions.filter(s => s.status === 'graded').length})</span>
            </button>
          </div>

          {/* Search by student name */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedAssignmentId}
              onChange={e => setSelectedAssignmentId(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-hidden text-xs"
            >
              <option value="all">Tất cả bài tập ({assignments.length})</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.title.slice(0, 30)}...</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-hidden text-xs"
            >
              <option value="all">Tất cả lớp</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>Lớp {c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Không có bài nộp nào phù hợp với bộ lọc hiện tại
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Học sinh</th>
                  <th className="p-3">Lớp</th>
                  <th className="p-3">Ngày sinh</th>
                  <th className="p-3">Mã đề</th>
                  <th className="p-3 text-center">Điểm TN</th>
                  <th className="p-3 text-center">Điểm TL</th>
                  <th className="p-3 text-center">Tổng điểm</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Báo điểm & Link kết quả</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredSubmissions.map(sub => {
                  const isPending = sub.status === 'needs_teacher_grading';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{sub.studentName}</div>
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400">
                          <span>{sub.receiptCode}</span>
                          {sub.studentEmail && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-sans">{sub.studentEmail}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{sub.className}</td>
                      <td className="p-3 text-slate-500">{sub.studentDob}</td>
                      <td className="p-3 font-bold text-blue-700">
                        {sub.variantCode ? `Mã ${sub.variantCode}` : 'Chính'}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {sub.multipleChoiceScore} đ
                      </td>
                      <td className="p-3 text-center">
                        {isPending ? (
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            Chờ chấm
                          </span>
                        ) : (
                          <span className="font-bold text-slate-700">{sub.essayScore} đ</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {isPending ? (
                          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            {sub.multipleChoiceScore} đ (Tạm tính)
                          </span>
                        ) : (
                          <span className="text-sm font-extrabold text-emerald-600">
                            {sub.totalScore} / 10
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <Clock className="w-3 h-3" /> Chờ chấm TL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Đã chấm xong
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Copy Link to Result for this test taker */}
                          <button
                            type="button"
                            onClick={() => handleCopyResultLink(sub)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200 transition-colors cursor-pointer"
                            title="Sao chép link kết quả bài làm để gửi Zalo cho học sinh hoặc phụ huynh"
                          >
                            {copiedSubId === sub.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Đã chép link!</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="w-3 h-3 text-blue-600" />
                                <span>Copy link kết quả</span>
                              </>
                            )}
                          </button>

                          {/* Quick preview student result card */}
                          <button
                            type="button"
                            onClick={() => setSelectedResultSub(sub)}
                            className="flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors cursor-pointer"
                            title="Xem trước phiếu kết quả hiển thị cho học sinh"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>Xem phiếu</span>
                          </button>

                          {/* Email notification if email exists */}
                          {sub.studentEmail && (
                            <button
                              type="button"
                              onClick={() => handleDirectSendEmail(sub)}
                              disabled={isSendingEmail}
                              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium text-[11px] transition-colors cursor-pointer"
                              title="Gửi email thông báo điểm cho học sinh này"
                            >
                              <Mail className="w-3 h-3 text-indigo-500" />
                              <span>Email</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenGrading(sub)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          {isPending ? 'Chấm tự luận' : 'Xem & Sửa điểm'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GRADING MODAL / DRAWER WITH AUTOMATED EMAIL NOTIFICATION */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Chấm Bài: {gradingSubmission.studentName}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                  <span>Lớp: {gradingSubmission.className}</span>
                  <span>•</span>
                  <span>Ngày sinh: {gradingSubmission.studentDob}</span>
                  <span>•</span>
                  <span>Mã đề: {gradingSubmission.variantCode}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">Điểm trắc nghiệm tự chấm</span>
                <span className="text-base font-extrabold text-blue-600">
                  {gradingSubmission.multipleChoiceScore} điểm
                </span>
              </div>
            </div>

            {/* List essay questions in exam */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {currentExam?.questions
                .filter(q => q.type === 'essay')
                .map((q, idx) => {
                  const studentAnswer = gradingSubmission.answers[q.id] || '(Học sinh để trống)';
                  return (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">
                          Câu tự luận {idx + 1} (Tối đa {q.points} điểm)
                        </span>

                        <button
                          onClick={() => handleRequestAiGrade(q, studentAnswer)}
                          disabled={isAiGrading}
                          className="flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Gợi ý chấm & Nhận xét</span>
                        </button>
                      </div>

                      {/* Question Text */}
                      <div className="text-xs text-slate-700 font-medium">
                        <MathRenderer content={q.questionText} />
                      </div>

                      {/* Student Answer */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Bài làm của học sinh:
                        </span>
                        <div className="text-xs text-slate-800 whitespace-pre-wrap font-sans">
                          {studentAnswer}
                        </div>
                      </div>

                      {/* Teacher Rubric / Explanation */}
                      {q.explanation && (
                        <div className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-200/50">
                          <span className="font-bold">Hướng dẫn chấm: </span>
                          <MathRenderer content={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* AI Suggestion Box */}
            {aiSuggestion && (
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 space-y-1 text-xs">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Gợi ý từ AI (Điểm đề xuất: {aiSuggestion.suggestedScore} đ)
                </div>
                <p className="text-indigo-800 italic">{aiSuggestion.feedback}</p>
              </div>
            )}

            {/* Score & Feedback Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm tự luận giáo viên cho
                </label>
                <input
                  type="number"
                  step={0.25}
                  min={0}
                  max={10}
                  value={inputEssayScore}
                  onChange={e => setInputEssayScore(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold text-blue-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhận xét sư phạm cho học sinh
                </label>
                <input
                  type="text"
                  value={inputFeedback}
                  onChange={e => setInputFeedback(e.target.value)}
                  placeholder="Ghi nhận xét động viên hoặc hướng dẫn khắc phục..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>
            </div>

            {/* Total score preview */}
            <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
              <span className="text-xs font-bold text-slate-700">Tổng điểm chính thức:</span>
              <span className="text-base font-extrabold text-emerald-600">
                {Math.round((gradingSubmission.multipleChoiceScore + inputEssayScore) * 100) / 100} / 10 điểm
              </span>
            </div>

            {/* Automated Email Notification Toggle & Config */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendEmailCheckbox"
                    checked={sendEmailOnSave}
                    onChange={e => setSendEmailOnSave(e.target.checked)}
                    className="accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="sendEmailCheckbox" className="text-xs font-bold text-blue-950 cursor-pointer flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tự động gửi email thông báo kết quả cho học sinh ngay khi duyệt</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewingEmailSub({
                    ...gradingSubmission,
                    essayScore: inputEssayScore,
                    totalScore: Math.round((gradingSubmission.multipleChoiceScore + inputEssayScore) * 100) / 100,
                    teacherFeedback: inputFeedback
                  })}
                  className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>Xem trước mẫu Email</span>
                </button>
              </div>

              {sendEmailOnSave && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600 whitespace-nowrap font-medium">Gửi tới:</span>
                  <input
                    type="email"
                    placeholder="Nhập email học sinh hoặc phụ huynh..."
                    value={recipientEmailInput}
                    onChange={e => setRecipientEmailInput(e.target.value)}
                    className="flex-1 text-xs p-2 border border-blue-200 rounded-lg bg-white focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveTeacherGrading}
                disabled={isSendingEmail}
                className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu & gửi email...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Lưu & Duyệt Kết Quả</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW EMAIL TEMPLATE MODAL */}
      {previewingEmailSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-bold text-slate-800">
                  Xem Trước Email Thông Báo Báo Điểm
                </h4>
              </div>
              <button onClick={() => setPreviewingEmailSub(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Giao diện email tự động học sinh và phụ huynh sẽ nhận được qua hộp thư:
            </div>

            {/* Rendered HTML Preview */}
            <div 
              className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html: generateScoreReportEmailHtml({
                  studentName: previewingEmailSub.studentName,
                  className: previewingEmailSub.className,
                  receiptCode: previewingEmailSub.receiptCode,
                  examTitle: currentAssignment?.title || 'Bài kiểm tra môn Toán',
                  multipleChoiceScore: previewingEmailSub.multipleChoiceScore,
                  essayScore: previewingEmailSub.essayScore,
                  totalScore: previewingEmailSub.totalScore,
                  teacherFeedback: previewingEmailSub.teacherFeedback,
                  teacherName: teacherSetting?.teacherName || 'Thầy Nguyễn Văn An',
                  schoolName: teacherSetting?.schoolName || 'THPT Chuyên Chu Văn An'
                })
              }}
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewingEmailSub(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL HISTORY / DISPATCH LOGS MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    Lịch Sử Gửi Email Thông Báo Tự Động
                  </h4>
                  <p className="text-xs text-slate-500">
                    Ghi nhận các email báo điểm đã được hệ thống gửi tự động đến học sinh
                  </p>
                </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chưa có email nào được gửi trong phiên làm việc này.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {emailLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{log.studentName}</span>
                        <span className="text-slate-500">({log.className})</span>
                        <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {log.receiptCode}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Gửi tới: <strong className="text-slate-800">{log.recipientEmail}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.sentAt).toLocaleString('vi-VN')} • Tổng điểm: <strong className="text-emerald-600">{log.totalScore}/10</strong>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Đã gửi
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  clearEmailNotificationLogs();
                  setEmailLogs([]);
                }}
                disabled={emailLogs.length === 0}
                className="text-xs text-rose-600 hover:underline disabled:opacity-30 cursor-pointer"
              >
                Xóa lịch sử gửi
              </button>

              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT RESULT PREVIEW MODAL */}
      {selectedResultSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedResultSub(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer z-10"
              title="Đóng xem kết quả"
            >
              <X className="w-5 h-5" />
            </button>
            <StudentResultView
              submission={selectedResultSub}
              assignment={assignments.find(a => a.id === selectedResultSub.assignmentId)}
              exam={exams.find(e => e.id === assignments.find(a => a.id === selectedResultSub.assignmentId)?.examId)}
              onClose={() => setSelectedResultSub(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
