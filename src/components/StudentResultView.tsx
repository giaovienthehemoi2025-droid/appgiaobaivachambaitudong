import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Award, 
  Copy, 
  Check, 
  Share2, 
  Printer, 
  ArrowLeft, 
  FileText, 
  User, 
  School, 
  Calendar, 
  HelpCircle,
  AlertCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Submission, Assignment, Exam } from '../types';
import { MathRenderer } from '../lib/mathRenderer';

interface StudentResultViewProps {
  submission: Submission;
  assignment?: Assignment;
  exam?: Exam;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export const StudentResultView: React.FC<StudentResultViewProps> = ({
  submission,
  assignment,
  exam,
  onClose,
  isStandalonePage = false
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Generate shareable link
  const resultLink = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?view=result&subId=${submission.id}`
    : `?view=result&subId=${submission.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resultLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareZalo = () => {
    const text = `📢 KẾT QUẢ BÀI LÀM: ${assignment?.title || 'Bài kiểm tra'}\n👤 Học sinh: ${submission.studentName} - Lớp ${submission.className}\n🎯 Tổng điểm: ${submission.totalScore}/10 điểm\n🔗 Link xem bài chi tiết: ${resultLink}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Academic tier helper
  const getAcademicTier = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất sắc', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (score >= 8.0) return { label: 'Giỏi', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (score >= 6.5) return { label: 'Khá', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    if (score >= 5.0) return { label: 'Trung bình', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'Cần cố gắng', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  const tier = getAcademicTier(submission.totalScore);
  const isPendingGrading = submission.status === 'needs_teacher_grading';

  // Questions to display
  // Try variant questions first, then exam questions
  const variant = assignment?.variants?.find(v => v.variantId === submission.variantId || v.variantCode === submission.variantCode);
  const questionsList = variant?.questions || exam?.questions || [];

  return (
    <div className={`min-h-screen bg-slate-100 ${isStandalonePage ? 'py-6 px-4 sm:px-6' : 'p-0'}`}>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Navigation / Action bar */}
        <div className="flex items-center justify-between print:hidden">
          {onClose ? (
            <button
              onClick={onClose}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          ) : (
            <a
              href={typeof window !== 'undefined' ? window.location.pathname : '/'}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trang chủ EDUNEXA</span>
            </a>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              title="In phiếu kết quả hoặc lưu file PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In kết quả</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã sao chép link!' : 'Sao chép link'}</span>
            </button>
          </div>
        </div>

        {/* Official Header Certificate Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Decorative background ribbon */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* School / Exam Header */}
          <div className="border-b border-slate-200 pb-5 text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold tracking-wide uppercase">
              <Award className="w-3.5 h-3.5" />
              Hệ Thống Khảo Thí EDUNEXA • Chuẩn Bộ GD&ĐT
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              PHIẾU KẾT QUẢ BÀI LÀM
            </h1>
            <p className="text-sm font-semibold text-slate-600">
              {assignment?.title || 'Bài kiểm tra khảo thí trực tuyến'}
            </p>
          </div>

          {/* Student & Submission Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <User className="w-3 h-3" /> Họ và tên:
              </span>
              <span className="font-bold text-slate-800 text-sm block truncate">
                {submission.studentName}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <School className="w-3 h-3" /> Lớp học:
              </span>
              <span className="font-bold text-slate-800 text-sm block">
                {submission.className}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Ngày sinh:
              </span>
              <span className="font-bold text-slate-800 block">
                {submission.studentDob || '--'}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <FileText className="w-3 h-3" /> Mã đề / Biên nhận:
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-blue-700 font-mono">
                  {submission.variantCode ? `Mã ${submission.variantCode}` : 'Chính'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({submission.receiptCode})
                </span>
              </div>
            </div>
          </div>

          {/* Big Score Card */}
          <div className={`p-5 rounded-2xl border text-center space-y-3 ${
            isPendingGrading 
              ? 'bg-amber-50/60 border-amber-200' 
              : 'bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-blue-50/60 border-emerald-200'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              {isPendingGrading ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Clock className="w-3.5 h-3.5" /> ĐANG CHỜ GIÁO VIÊN DUYỆT CHẤM TỰ LUẬN
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ HOÀN TẤT CHẤM ĐIỂM CHÍNH THỨC
                </span>
              )}

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${tier.color}`}>
                Xếp loại: {tier.label}
              </span>
            </div>

            {/* Total Score display */}
            <div>
              <span className="text-xs text-slate-500 font-medium block">Tổng điểm đạt được</span>
              <div className="text-5xl font-black text-slate-900 tracking-tight my-1">
                {submission.totalScore}
                <span className="text-xl text-slate-400 font-bold ml-1">/ 10</span>
              </div>
            </div>

            {/* Sub-scores: Multiple Choice & Essay */}
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-2 border-t border-slate-200/60 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Điểm trắc nghiệm:</span>
                <span className="text-base font-extrabold text-blue-700">
                  {submission.multipleChoiceScore} đ
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Điểm tự luận:</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {isPendingGrading ? 'Chờ chấm' : `${submission.essayScore} đ`}
                </span>
              </div>
            </div>

            {submission.gradedBy && (
              <p className="text-[11px] text-slate-500">
                Chấm bởi: <span className="font-semibold text-slate-700">{submission.gradedBy}</span>
              </p>
            )}
          </div>

          {/* Teacher Feedback / Lời nhận xét của giáo viên */}
          {submission.teacherFeedback && (
            <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200/70 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Lời phê & Nhận xét của Thầy / Cô:</span>
              </div>
              <p className="text-xs text-indigo-950 font-medium whitespace-pre-wrap pl-5 border-l-2 border-indigo-400 italic">
                "{submission.teacherFeedback}"
              </p>
            </div>
          )}

          {/* Shareable Link Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 print:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                Link tra cứu kết quả cá nhân của học sinh:
              </span>
              <span className="text-[10px] text-slate-400">
                Chia sẻ cho phụ huynh & lưu đối chiếu
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={resultLink}
                className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 select-all focus:outline-hidden"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shrink-0 shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <button
                onClick={handleShareZalo}
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                <span>{copiedSummary ? '✓ Đã sao chép nội dung báo điểm' : '📋 Chép tin nhắn báo điểm gửi Zalo/Phụ huynh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Question by Question Review */}
        {questionsList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Chi Tiết Bài Làm Từng Câu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đối chiếu câu trả lời của học sinh và thang điểm chuẩn
                </p>
              </div>

              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {questionsList.length} câu
              </span>
            </div>

            <div className="space-y-4">
              {questionsList.map((q, idx) => {
                const studentAnswer = submission.answers[q.id];
                const isEssay = q.type === 'essay';
                
                // For multiple choice
                const isCorrect = !isEssay && q.correctOptionId && studentAnswer === q.correctOptionId;
                const answered = Boolean(studentAnswer);

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-xl border text-xs space-y-3 transition-colors ${
                      isEssay
                        ? 'bg-slate-50/70 border-slate-200'
                        : answered
                          ? isCorrect
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-rose-50/40 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">
                          Câu {idx + 1}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {q.points} điểm
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {q.topic}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        {isEssay ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Tự luận
                          </span>
                        ) : !answered ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                            Chưa làm
                          </span>
                        ) : isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Đúng (+{q.points}đ)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertCircle className="w-3 h-3" /> Sai (0đ)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question text */}
                    <div className="text-slate-800 font-medium text-xs leading-relaxed">
                      <MathRenderer content={q.questionText} />
                    </div>

                    {/* Answer choices for Multiple Choice */}
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isStudentSelected = studentAnswer === opt.id;
                          const isSystemCorrect = q.correctOptionId === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border flex items-center space-x-2 text-xs ${
                                isStudentSelected && isSystemCorrect
                                  ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-semibold'
                                  : isStudentSelected && !isSystemCorrect
                                    ? 'bg-rose-100/70 border-rose-400 text-rose-950 font-semibold'
                                    : isSystemCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                                      : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                isStudentSelected
                                  ? isSystemCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  : isSystemCorrect
                                    ? 'bg-emerald-200 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                              }`}>
                                {letter}
                              </span>
                              <div className="flex-1">
                                <MathRenderer content={opt.text} />
                              </div>
                              {isStudentSelected && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 font-bold">
                                  Học sinh chọn
                                </span>
                              )}
                              {isSystemCorrect && !isStudentSelected && (
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Student Essay text */}
                    {isEssay && (
                      <div className="space-y-2 pt-1">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                            Bài làm tự luận của học sinh:
                          </span>
                          <p className="text-slate-800 whitespace-pre-wrap font-sans text-xs">
                            {studentAnswer || '(Học sinh để trống)'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200/60 text-[11px] text-slate-600 space-y-0.5">
                        <span className="font-bold text-amber-800 block">Lời giải / Hướng dẫn:</span>
                        <div>
                          <MathRenderer content={q.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
