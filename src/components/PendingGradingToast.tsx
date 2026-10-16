import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Copy, 
  Eye, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  Edit3, 
  ArrowRight,
  Clock,
  User,
  GraduationCap
} from 'lucide-react';
import { Submission, Assignment, Exam } from '../types';

interface PendingGradingToastProps {
  pendingSubmissions: Submission[];
  assignments: Assignment[];
  exams?: Exam[];
  onQuickGrade: (submission: Submission) => void;
  onViewResult: (submission: Submission) => void;
  onCopyResultLink: (submission: Submission) => void;
  copiedSubId: string | null;
  onNavigateToSubmissions: () => void;
  onSimulateSubmission?: () => void;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
}

export const PendingGradingToast: React.FC<PendingGradingToastProps> = ({
  pendingSubmissions,
  assignments,
  exams,
  onQuickGrade,
  onViewResult,
  onCopyResultLink,
  copiedSubId,
  onNavigateToSubmissions,
  onSimulateSubmission,
  isOpen,
  onToggleOpen
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hasNewPulse, setHasNewPulse] = useState<boolean>(false);
  const prevCountRef = useRef<number>(pendingSubmissions.length);

  // Play a soft pleasant notification chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy might restrict without prior interaction
    }
  };

  // Watch for new submissions arriving
  useEffect(() => {
    if (pendingSubmissions.length > prevCountRef.current) {
      playChime();
      setHasNewPulse(true);
      if (!isOpen) onToggleOpen(true);
      setIsMinimized(false);
      const timer = setTimeout(() => setHasNewPulse(false), 5000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = pendingSubmissions.length;
  }, [pendingSubmissions.length]);

  if (!isOpen) return null;

  // Format relative time
  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa mới nộp';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return new Date(isoString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Vừa nộp';
    }
  };

  // Minimized floating action pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-40 transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-bottom-3">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-full shadow-xl border cursor-pointer transition-all ${
            pendingSubmissions.length > 0
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400 hover:brightness-105 ring-4 ring-amber-500/20'
              : 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'
          }`}
        >
          <div className="relative">
            <BellRing className={`w-4 h-4 ${pendingSubmissions.length > 0 ? 'animate-bounce' : ''}`} />
            {pendingSubmissions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping" />
            )}
          </div>
          <span className="text-xs font-bold">
            {pendingSubmissions.length > 0
              ? `${pendingSubmissions.length} bài vừa nộp cần chấm`
              : 'Thông báo bài nộp'}
          </span>
          <span className="bg-white/20 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
            Mở xem
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside 
      aria-label="Thông báo bài nộp mới cần chấm"
      className="fixed bottom-5 right-5 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] sm:w-[430px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className={`bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col transition-all ${
        hasNewPulse 
          ? 'border-amber-400 ring-4 ring-amber-400/30' 
          : 'border-slate-200/90 ring-1 ring-slate-900/5'
      }`}>
        {/* Header Bar */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Bell className="w-4 h-4 text-white animate-bounce" />
              </div>
              {pendingSubmissions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <h4 className="text-xs font-extrabold tracking-wide uppercase truncate">
                  Bài Nộp Mới Cần Chấm Ngay
                </h4>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs shrink-0">
                  {pendingSubmissions.length} bài
                </span>
              </div>
              <p className="text-[11px] text-amber-100 truncate">
                {pendingSubmissions.length > 0
                  ? 'Học sinh đang chờ công bố điểm tự luận'
                  : 'Tất cả bài tập đã được chấm đầy đủ'}
              </p>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 opacity-60" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              title="Thu nhỏ thông báo"
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleOpen(false)}
              title="Đóng thông báo"
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* List of Submissions needing Teacher Grading */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-2.5 bg-slate-50/70 divide-y divide-slate-100">
          {pendingSubmissions.length === 0 ? (
            <div className="py-7 px-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                Không có bài tập nào cần chấm ngay
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Khi học sinh nộp bài có phần tự luận, thông báo toast sẽ tự động xuất hiện tại đây cùng chuông báo để giáo viên chấm điểm kịp thời.
              </p>
              {onSimulateSubmission && (
                <button
                  type="button"
                  onClick={onSimulateSubmission}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Giả lập 1 bài nộp mới để kiểm tra</span>
                </button>
              )}
            </div>
          ) : (
            pendingSubmissions.map((sub, index) => {
              const targetAsg = assignments.find(a => a.id === sub.assignmentId);
              const targetExam = exams?.find(e => e.id === targetAsg?.examId);
              const isNewlyArrived = index === 0;

              return (
                <div
                  key={sub.id}
                  className={`pt-2.5 first:pt-0 group transition-all`}
                >
                  <div className={`p-3 rounded-xl border bg-white transition-all shadow-2xs hover:shadow-xs hover:border-amber-300 ${
                    isNewlyArrived ? 'border-amber-200 ring-1 ring-amber-300/40' : 'border-slate-200'
                  }`}>
                    {/* Top Row: Tag & Time */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          Cần chấm tự luận
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                          TN: {sub.multipleChoiceScore} đ
                        </span>
                      </div>
                      <span className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>{formatRelativeTime(sub.submittedAt)}</span>
                      </span>
                    </div>

                    {/* Middle Row: Student & Exam */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sub.studentName}</span>
                          <span className="text-[11px] font-bold text-slate-500 px-1.5 py-0.2 bg-slate-100 rounded-md shrink-0">
                            Lớp {sub.className}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center space-x-1.5">
                          <span className="text-slate-400 font-mono">Mã {sub.variantCode}</span>
                          <span>•</span>
                          <span className="truncate text-slate-600 font-medium">
                            {targetAsg?.title || targetExam?.title || 'Bài kiểm tra'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar for this Submission */}
                    <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => onViewResult(sub)}
                          title="Xem toàn bộ bài làm của học sinh"
                          className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-md transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Xem bài</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onCopyResultLink(sub)}
                          title="Sao chép link kết quả"
                          className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-md transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedSubId === sub.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Đã copy</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onQuickGrade(sub)}
                        className="px-3 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg shadow-xs shadow-amber-600/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Chấm ngay →</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
          {onSimulateSubmission && (
            <button
              type="button"
              onClick={onSimulateSubmission}
              title="Thêm bài nộp mẫu để kiểm tra tính năng"
              className="text-[11px] font-bold text-slate-600 hover:text-amber-700 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Giả lập bài nộp</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToSubmissions}
            className="ml-auto inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Trang Chấm bài ({pendingSubmissions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
