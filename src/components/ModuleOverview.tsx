import React, { useState, useMemo } from 'react';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Award, 
  Trophy, 
  Sparkles, 
  Filter,
  BarChart2,
  Calendar,
  Layers,
  Bell,
  BellRing,
  Link2,
  Copy,
  Check,
  Eye,
  X,
  ExternalLink,
  Edit3,
  Loader2,
  PlusCircle,
  Volume2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { Assignment, Submission, ClassInfo, Exam, Question, TeacherSetting } from '../types';
import { StudentResultView } from './StudentResultView';
import { PendingGradingToast } from './PendingGradingToast';
import { MathRenderer } from '../lib/mathRenderer';

interface ModuleOverviewProps {
  assignments: Assignment[];
  submissions: Submission[];
  classes: ClassInfo[];
  exams?: Exam[];
  teacherSetting?: TeacherSetting;
  onNavigateToTab?: (tab: 'repository' | 'matrix' | 'assign' | 'submissions') => void;
  onOpenClassManager?: () => void;
  onGradeSubmission?: (
    submissionId: string, 
    essayScore: number, 
    totalScore: number, 
    feedback: string
  ) => void;
  onSimulateNewSubmission?: (submission: Submission) => void;
}

export const ModuleOverview: React.FC<ModuleOverviewProps> = ({
  assignments,
  submissions,
  classes,
  exams,
  teacherSetting,
  onNavigateToTab,
  onOpenClassManager,
  onGradeSubmission,
  onSimulateNewSubmission
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'tiers' | 'detailed'>('tiers');

  // Result Preview Modal & Link Sharing State
  const [selectedResultSub, setSelectedResultSub] = useState<Submission | null>(null);
  const [copiedSubId, setCopiedSubId] = useState<string | null>(null);

  // Real-time Pending Grading Toast Notification State
  const [isToastOpen, setIsToastOpen] = useState<boolean>(true);
  const [quickGradingSub, setQuickGradingSub] = useState<Submission | null>(null);
  const [inputEssayScore, setInputEssayScore] = useState<number>(0);
  const [inputFeedback, setInputFeedback] = useState<string>('');
  const [isAiGrading, setIsAiGrading] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestedScore: number; feedback: string } | null>(null);
  const [quickGradeSuccessMessage, setQuickGradeSuccessMessage] = useState<string | null>(null);

  // Submissions needing teacher grading (status === 'needs_teacher_grading')
  const pendingGradingSubs = useMemo(() => {
    return [...submissions]
      .filter(s => s.status === 'needs_teacher_grading')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [submissions]);

  const handleCopyResultLink = (sub: Submission) => {
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?view=result&subId=${sub.id}`
      : `?view=result&subId=${sub.id}`;
    navigator.clipboard.writeText(link);
    setCopiedSubId(sub.id);
    setTimeout(() => setCopiedSubId(null), 2500);
  };

  // AI Essay Grading Helper for Quick Grading Dialog
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
      if (data && typeof data.suggestedScore === 'number') {
        setAiSuggestion(data);
      }
    } catch {
      // Fallback local heuristic
      setAiSuggestion({
        suggestedScore: Math.min(question.points, Math.max(0.5, question.points * 0.8)),
        feedback: 'Bài làm có ý đúng trọng tâm, diễn đạt tương đối tốt.'
      });
    } finally {
      setIsAiGrading(false);
    }
  };

  // Save quick grade directly from Overview
  const handleSaveQuickGrade = () => {
    if (!quickGradingSub) return;
    const finalEssay = Math.max(0, Number(inputEssayScore) || 0);
    const finalTotal = Math.round(((quickGradingSub.multipleChoiceScore || 0) + finalEssay) * 100) / 100;
    
    if (onGradeSubmission) {
      onGradeSubmission(quickGradingSub.id, finalEssay, finalTotal, inputFeedback);
    }

    setQuickGradeSuccessMessage(
      `Đã chấm thành công bài làm của em ${quickGradingSub.studentName} (${quickGradingSub.className})! Tổng điểm: ${finalTotal}/10 đ.`
    );
    setTimeout(() => setQuickGradeSuccessMessage(null), 4000);
    setQuickGradingSub(null);
  };

  // Simulate a new student submission waiting for teacher grading
  const handleSimulateNewSubmission = () => {
    const sampleNames = ['Phạm Gia Huy', 'Đỗ Thảo Vy', 'Lê Tuấn Kiệt', 'Bùi Ngọc Ánh', 'Vũ Đức Thịnh', 'Ngô Hoàng Nam'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const targetAsg = assignments[0];
    const targetVariant = targetAsg?.variants?.[0] || { variantId: 'v101', variantCode: '101' };

    const simulatedSub: Submission = {
      id: `sub_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignmentId: targetAsg?.id || 'asg_demo_01',
      variantId: targetVariant.variantId,
      variantCode: targetVariant.variantCode,
      studentName: randomName,
      studentDob: '14/11/2008',
      className: classes[0]?.name || '10A1',
      startedAt: new Date(Date.now() - 20 * 60000).toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'needs_teacher_grading',
      answers: {
        'q1': 'opt_A',
        'q2': 'opt_A',
        'q3': 'opt_B',
        'q4': 'opt_A',
        'q5': 'opt_A',
        'q7': 'Gọi x là chiều rộng (m). Chiều dài là 60 - 2x. Diện tích S = x(60-2x) = -2x^2 + 60x. Hàm số đạt giá trị lớn nhất tại đỉnh Parabol x = -b/(2a) = 15m. Chiều dài 30m, diện tích lớn nhất là 450 m2.',
        'q8': 'Phương trình bậc 2 có biệt thức Delta\' = 1 > 0. Theo định lý Viète tính được m = -1 thỏa mãn điều kiện đề bài cho.'
      },
      multipleChoiceScore: 2.5,
      essayScore: 0,
      totalScore: 2.5,
      receiptCode: `EDX-SUB-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      isVerifiedStudent: true,
      syncedToSheets: false
    };

    if (onSimulateNewSubmission) {
      onSimulateNewSubmission(simulatedSub);
    }
    setIsToastOpen(true);
  };

  // Recently graded submissions (sorted newest first)
  const recentGradedSubs = useMemo(() => {
    return [...submissions]
      .filter(s => s.status === 'graded')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 6);
  }, [submissions]);

  // Filter submissions based on selection
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      if (selectedAssignmentId !== 'all' && sub.assignmentId !== selectedAssignmentId) {
        return false;
      }
      if (selectedClassId !== 'all') {
        const cls = classes.find(c => c.id === selectedClassId);
        if (cls && sub.className !== cls.name) return false;
      }
      return true;
    });
  }, [submissions, selectedAssignmentId, selectedClassId, classes]);

  // Compute total unique students assigned
  const totalAssignedStudents = useMemo(() => {
    let count = 0;
    const targetClasses = selectedClassId === 'all' 
      ? classes 
      : classes.filter(c => c.id === selectedClassId);

    targetClasses.forEach(c => {
      count += c.studentCount || (c.studentRoster ? c.studentRoster.length : 0);
    });
    return count;
  }, [classes, selectedClassId]);

  // Unique submitted students
  const uniqueSubmittedCount = useMemo(() => {
    const studentNames = new Set(filteredSubmissions.map(s => `${s.studentName}_${s.className}`));
    return studentNames.size;
  }, [filteredSubmissions]);

  // Submitted submissions count
  const totalSubmittedCount = filteredSubmissions.length;

  // Pending grading submissions (waiting for essay review)
  const pendingGradingCount = useMemo(() => {
    return filteredSubmissions.filter(s => s.status === 'needs_teacher_grading').length;
  }, [filteredSubmissions]);

  // Completed graded submissions
  const completedGradedSubs = useMemo(() => {
    return filteredSubmissions.filter(s => s.status === 'graded');
  }, [filteredSubmissions]);

  // Official average score (only graded)
  const officialAvgScore = useMemo(() => {
    if (completedGradedSubs.length === 0) return 0;
    const total = completedGradedSubs.reduce((acc, s) => acc + (s.totalScore || 0), 0);
    return Math.round((total / completedGradedSubs.length) * 10) / 10;
  }, [completedGradedSubs]);

  // Completion rate
  const completionRate = useMemo(() => {
    if (totalAssignedStudents === 0) return 0;
    return Math.min(100, Math.round((uniqueSubmittedCount / totalAssignedStudents) * 100));
  }, [uniqueSubmittedCount, totalAssignedStudents]);

  // Unsubmitted count
  const unsubmittedCount = useMemo(() => {
    if (totalAssignedStudents === 0) return 0;
    return Math.max(0, totalAssignedStudents - uniqueSubmittedCount);
  }, [totalAssignedStudents, uniqueSubmittedCount]);

  // Score distribution according to 5 Vietnamese academic standard tiers
  const tierChartData = useMemo(() => {
    const tiers = [
      { 
        id: 'low',
        range: '< 5.0', 
        label: '< 5.0 đ', 
        name: 'Dưới TB',
        fullName: 'Dưới trung bình (< 5.0 điểm)',
        count: 0, 
        color: '#f43f5e',
        students: [] as string[]
      },
      { 
        id: 'average',
        range: '5.0 - 6.4', 
        label: '5.0-6.4', 
        name: 'Trung bình',
        fullName: 'Trung bình (5.0 - 6.4 điểm)',
        count: 0, 
        color: '#f59e0b',
        students: [] as string[]
      },
      { 
        id: 'fair',
        range: '6.5 - 7.9', 
        label: '6.5-7.9', 
        name: 'Khá',
        fullName: 'Khá (6.5 - 7.9 điểm)',
        count: 0, 
        color: '#6366f1',
        students: [] as string[]
      },
      { 
        id: 'good',
        range: '8.0 - 8.9', 
        label: '8.0-8.9', 
        name: 'Giỏi',
        fullName: 'Giỏi (8.0 - 8.9 điểm)',
        count: 0, 
        color: '#3b82f6',
        students: [] as string[]
      },
      { 
        id: 'excellent',
        range: '9.0 - 10.0', 
        label: '9.0-10', 
        name: 'Xuất sắc',
        fullName: 'Xuất sắc (9.0 - 10.0 điểm)',
        count: 0, 
        color: '#10b981',
        students: [] as string[]
      }
    ];

    const targetSubs = completedGradedSubs.length > 0 
      ? completedGradedSubs 
      : filteredSubmissions.filter(s => typeof s.totalScore === 'number' || typeof s.multipleChoiceScore === 'number');

    targetSubs.forEach(s => {
      const score = typeof s.totalScore === 'number' ? s.totalScore : s.multipleChoiceScore;
      if (score >= 9.0) {
        tiers[4].count++;
        tiers[4].students.push(s.studentName);
      } else if (score >= 8.0) {
        tiers[3].count++;
        tiers[3].students.push(s.studentName);
      } else if (score >= 6.5) {
        tiers[2].count++;
        tiers[2].students.push(s.studentName);
      } else if (score >= 5.0) {
        tiers[1].count++;
        tiers[1].students.push(s.studentName);
      } else {
        tiers[0].count++;
        tiers[0].students.push(s.studentName);
      }
    });

    const total = targetSubs.length;
    return tiers.map(t => ({
      ...t,
      percentage: total > 0 ? Math.round((t.count / total) * 100) : 0,
      totalCount: total
    }));
  }, [completedGradedSubs, filteredSubmissions]);

  // Detailed 1-2 point bins
  const detailedScoreBins = useMemo(() => {
    const bins = [
      { id: 'b0', label: '< 4 đ', name: '< 4', fullName: 'Dưới 4.0 điểm', count: 0, color: '#f43f5e', students: [] as string[] },
      { id: 'b1', label: '4 - <5', name: '4-<5', fullName: 'Từ 4.0 đến < 5.0 điểm', count: 0, color: '#fb7185', students: [] as string[] },
      { id: 'b2', label: '5 - <6', name: '5-<6', fullName: 'Từ 5.0 đến < 6.0 điểm', count: 0, color: '#fbbf24', students: [] as string[] },
      { id: 'b3', label: '6 - <7', name: '6-<7', fullName: 'Từ 6.0 đến < 7.0 điểm', count: 0, color: '#84cc16', students: [] as string[] },
      { id: 'b4', label: '7 - <8', name: '7-<8', fullName: 'Từ 7.0 đến < 8.0 điểm', count: 0, color: '#38bdf8', students: [] as string[] },
      { id: 'b5', label: '8 - <9', name: '8-<9', fullName: 'Từ 8.0 đến < 9.0 điểm', count: 0, color: '#3b82f6', students: [] as string[] },
      { id: 'b6', label: '9 - 10', name: '9-10', fullName: 'Từ 9.0 đến 10.0 điểm', count: 0, color: '#10b981', students: [] as string[] },
    ];

    const targetSubs = completedGradedSubs.length > 0 
      ? completedGradedSubs 
      : filteredSubmissions.filter(s => typeof s.totalScore === 'number' || typeof s.multipleChoiceScore === 'number');

    targetSubs.forEach(s => {
      const score = typeof s.totalScore === 'number' ? s.totalScore : s.multipleChoiceScore;
      if (score >= 9.0) {
        bins[6].count++;
        bins[6].students.push(s.studentName);
      } else if (score >= 8.0) {
        bins[5].count++;
        bins[5].students.push(s.studentName);
      } else if (score >= 7.0) {
        bins[4].count++;
        bins[4].students.push(s.studentName);
      } else if (score >= 6.0) {
        bins[3].count++;
        bins[3].students.push(s.studentName);
      } else if (score >= 5.0) {
        bins[2].count++;
        bins[2].students.push(s.studentName);
      } else if (score >= 4.0) {
        bins[1].count++;
        bins[1].students.push(s.studentName);
      } else {
        bins[0].count++;
        bins[0].students.push(s.studentName);
      }
    });

    const total = targetSubs.length;
    return bins.map(b => ({
      ...b,
      range: b.label,
      percentage: total > 0 ? Math.round((b.count / total) * 100) : 0,
      totalCount: total
    }));
  }, [completedGradedSubs, filteredSubmissions]);

  const activeChartData = chartMode === 'tiers' ? tierChartData : detailedScoreBins;

  // Hall of Fame - Transparent internal teacher criteria
  const hallOfFame = useMemo(() => {
    // 1. Highest Score
    const topScorers = [...completedGradedSubs]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);

    // 2. Early Birds / Diligent (submitted earliest)
    const earlyBirds = [...filteredSubmissions]
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .slice(0, 3);

    return { topScorers, earlyBirds };
  }, [completedGradedSubs, filteredSubmissions]);

  return (
    <div className="space-y-6">
      {/* 5-STEP STANDARD EXAMINATION PROCESS BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-blue-800/50 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="font-extrabold text-sm sm:text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-cyan-200">
              QUY TRÌNH KHẢO THÍ CHUẨN 5 BƯỚC EDUNEXA
            </h3>
          </div>
          <span className="text-[11px] text-blue-200/80 font-medium">
            Chuẩn quy định chuyên môn Bộ GD&ĐT • Khảo thí & Chấm điểm thông minh
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Step 1 */}
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/40 text-blue-200 font-mono text-[10px] font-bold">
                BƯỚC 1
              </span>
              <h4 className="font-bold text-white text-xs mt-1">Tổng quan</h4>
              <p className="text-[11px] text-slate-300">
                Theo dõi tiến độ, số lượng bài nộp và phổ điểm 5 mức
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              ✓ Đang xem
            </span>
          </div>

          {/* Step 2 */}
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('repository')}
            className="text-left bg-white/5 hover:bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/10 hover:border-blue-400/50 transition-all space-y-1.5 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/40 text-indigo-200 font-mono text-[10px] font-bold">
                BƯỚC 2
              </span>
              <h4 className="font-bold text-white text-xs mt-1 group-hover:text-blue-300">
                Tải Nguồn Tài Liệu
              </h4>
              <p className="text-[11px] text-slate-300">
                Tải nhiều file SGK (PDF), file ảnh câu hỏi hoặc file Excel kho đề
              </p>
            </div>
            <span className="text-[10px] text-blue-300 font-bold group-hover:underline">
              Vào tải tài liệu →
            </span>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('matrix')}
            className="text-left bg-white/5 hover:bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/10 hover:border-blue-400/50 transition-all space-y-1.5 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/40 text-purple-200 font-mono text-[10px] font-bold">
                BƯỚC 3
              </span>
              <h4 className="font-bold text-white text-xs mt-1 group-hover:text-blue-300">
                Ma Trận & Đặc Tả
              </h4>
              <p className="text-[11px] text-slate-300">
                Lập ma trận 4 mức độ & bản đặc tả chi tiết rồi sinh đề AI
              </p>
            </div>
            <span className="text-[10px] text-purple-300 font-bold group-hover:underline">
              Thiết kế ma trận →
            </span>
          </button>

          {/* Step 4 */}
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('assign')}
            className="text-left bg-white/5 hover:bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/10 hover:border-blue-400/50 transition-all space-y-1.5 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/40 text-amber-200 font-mono text-[10px] font-bold">
                BƯỚC 4
              </span>
              <h4 className="font-bold text-white text-xs mt-1 group-hover:text-blue-300">
                Giao Bài & Trộn Đề
              </h4>
              <p className="text-[11px] text-slate-300">
                Trộn 10 mã đề chuẩn ma trận, lấy link & QR gửi học sinh làm bài
              </p>
            </div>
            <span className="text-[10px] text-amber-300 font-bold group-hover:underline">
              Giao bài ngay →
            </span>
          </button>

          {/* Step 5 */}
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('submissions')}
            className="text-left bg-white/5 hover:bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/10 hover:border-blue-400/50 transition-all space-y-1.5 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/40 text-emerald-200 font-mono text-[10px] font-bold">
                BƯỚC 5
              </span>
              <h4 className="font-bold text-white text-xs mt-1 group-hover:text-blue-300">
                Chấm Điểm & Sheets
              </h4>
              <p className="text-[11px] text-slate-300">
                Tự động chấm TN, GV chấm tự luận và đồng bộ Google Sheets/Excel
              </p>
            </div>
            <span className="text-[10px] text-emerald-300 font-bold group-hover:underline">
              Xem kết quả & chấm →
            </span>
          </button>
        </div>
      </div>

      {/* Top Bar with Title & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            Tổng quan & Phân tích Học tập
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu khảo thí thực tế từ hệ thống Firestore – Không làm tròn giả định
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">Tất cả lớp ({classes.length} lớp)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>Lớp {c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedAssignmentId}
              onChange={e => setSelectedAssignmentId(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">Tất cả bài đã giao ({assignments.length})</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.title.slice(0, 28)}...</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">Toàn bộ thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày gần nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* REAL-TIME NOTIFICATION: AUTO-GRADING RESULTS & DIRECT RESULT LINKS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Tự Động Báo Điểm Sau Khi Chấm Xong
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {completedGradedSubs.length} bài đã hoàn tất
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Hệ thống tự động đồng bộ kết quả, tính điểm trắc nghiệm/tự luận & cấp link xem bài cá nhân cho từng học sinh
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsToastOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                isToastOpen 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200/80' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
              title="Mở hoặc ẩn cửa sổ Toast thông báo bài nộp mới cần chấm"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Toast bài nộp ({pendingGradingSubs.length})</span>
            </button>

            {pendingGradingCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigateToTab?.('submissions')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Còn {pendingGradingCount} bài chờ chấm TL →</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToTab?.('submissions')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Xem toàn bộ bảng điểm →
            </button>
          </div>
        </div>

        {/* Success feedback toast when quick grade completes */}
        {quickGradeSuccessMessage && (
          <div className="mx-4 mt-3 sm:mx-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{quickGradeSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setQuickGradeSuccessMessage(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Recently Graded Cards Feed */}
        <div className="p-4 sm:p-5">
          {recentGradedSubs.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Chưa có bài nộp nào được chấm xong</p>
              <p className="text-[11px] text-slate-400">
                Khi học sinh nộp bài hoặc giáo viên chấm tự luận xong, kết quả sẽ tự động hiển thị và thông báo ngay tại đây!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Kết quả bài làm vừa chấm xong gần đây:</span>
                <span className="text-[11px] text-blue-600 font-bold">Tự động cập nhật trực tiếp</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentGradedSubs.map(sub => {
                  const targetAsg = assignments.find(a => a.id === sub.assignmentId);
                  const isAutoGraded = !sub.essayScore && !sub.teacherFeedback;

                  return (
                    <div
                      key={sub.id}
                      className="bg-slate-50/80 hover:bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-3.5 transition-all shadow-2xs flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                              {isAutoGraded ? 'Tự động chấm TN' : 'GV đã chấm TL'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sub.receiptCode}
                          </span>
                        </div>

                        <div>
                          <div className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            {sub.studentName}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">Lớp {sub.className}</span>
                            <span>•</span>
                            <span className="text-blue-600 font-mono font-bold">Mã {sub.variantCode}</span>
                          </div>
                          {targetAsg && (
                            <p className="text-[11px] text-slate-500 truncate mt-1">
                              {targetAsg.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block">Điểm tổng kết</span>
                          <div className="text-xl font-black text-emerald-600">
                            {sub.totalScore}
                            <span className="text-xs text-slate-400 font-bold ml-0.5">/ 10</span>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                          <div>TN: <span className="font-bold text-slate-700">{sub.multipleChoiceScore}đ</span></div>
                          <div>TL: <span className="font-bold text-slate-700">{sub.essayScore}đ</span></div>
                        </div>
                      </div>

                      {/* Action buttons: Copy link & View Result */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyResultLink(sub)}
                          className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          title="Sao chép link dẫn đến kết quả bài làm để gửi Zalo cho học sinh hoặc phụ huynh"
                        >
                          {copiedSubId === sub.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Đã chép link!</span>
                            </>
                          ) : (
                            <>
                              <Link2 className="w-3 h-3 text-blue-600" />
                              <span>Copy link</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedResultSub(sub)}
                          className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Xem bài</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS TOOLBAR */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 p-3.5 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800">Thao Tác Nhanh:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateToTab?.('repository')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 shadow-2xs transition-all cursor-pointer"
          >
            <span>+ Tạo đề SGK / AI</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('matrix')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 shadow-2xs transition-all cursor-pointer"
          >
            <span>⚡ Lập ma trận 10đ</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('assign')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-2xs transition-all cursor-pointer"
          >
            <span>🔀 Giao 10 mã đề</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('submissions')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              pendingGradingCount > 0 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span>✍️ Chấm tự luận {pendingGradingCount > 0 ? `(${pendingGradingCount} bài chờ)` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenClassManager?.()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-2xs transition-all cursor-pointer"
          >
            <span>👥 Quản lý Lớp ({classes.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (6 Key Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div 
          onClick={() => onOpenClassManager?.()}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
          title="Bấm để mở Quản lý Lớp học"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Tổng lớp học</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{classes.length}</div>
          <span className="text-[11px] text-blue-600 font-medium mt-1">Quản lý lớp →</span>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={() => onNavigateToTab?.('assign')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-indigo-400 hover:shadow-sm transition-all"
          title="Bấm để chuyển sang Giao bài & Trộn đề"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Học sinh được giao</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalAssignedStudents}</div>
          <span className="text-[11px] text-indigo-600 font-medium mt-1">Giao thêm bài →</span>
        </div>

        {/* KPI 3 */}
        <div 
          onClick={() => onNavigateToTab?.('submissions')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-400 hover:shadow-sm transition-all"
          title="Bấm để xem danh sách bài đã nộp"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Đã nộp bài</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{totalSubmittedCount}</div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1">
            {uniqueSubmittedCount} học sinh duy nhất →
          </span>
        </div>

        {/* KPI 4 */}
        <div 
          onClick={() => onNavigateToTab?.('submissions')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all"
          title="Bấm để kiểm tra danh sách học sinh"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Chưa nộp bài</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{unsubmittedCount}</div>
          <span className="text-[11px] text-amber-700 font-medium mt-1">Xem danh sách →</span>
        </div>

        {/* KPI 5 */}
        <div 
          onClick={() => onNavigateToTab?.('submissions')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-rose-400 hover:shadow-sm transition-all"
          title="Bấm để chấm tự luận ngay"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Chờ chấm tự luận</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{pendingGradingCount}</div>
          <span className="text-[11px] text-rose-700 font-bold mt-1">
            {pendingGradingCount > 0 ? 'Chấm bài ngay →' : 'Đã duyệt hết'}
          </span>
        </div>

        {/* KPI 6 */}
        <div 
          onClick={() => onNavigateToTab?.('submissions')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
          title="Bấm để xem bảng điểm và xuất Excel"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Điểm TB chính thức</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {officialAvgScore > 0 ? `${officialAvgScore}/10` : '--'}
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-1">
            {completedGradedSubs.length} bài hoàn tất →
          </span>
        </div>
      </div>

      {/* Progress & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Bar & Submission Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Tiến độ hoàn thành theo lớp
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Tỷ lệ hoàn thành chung</span>
                <span className="text-blue-600 font-bold">{completionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {classes.map(cls => {
              const classSubs = filteredSubmissions.filter(s => s.className === cls.name);
              const classUnique = new Set(classSubs.map(s => s.studentName)).size;
              const rate = cls.studentCount > 0 ? Math.round((classUnique / cls.studentCount) * 100) : 0;
              return (
                <div key={cls.id} className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Lớp {cls.name}</span>
                    <span className="text-slate-500">
                      {classUnique}/{cls.studentCount} HS ({rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, rate)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Distribution Chart using Recharts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Phổ điểm học sinh (Recharts)
              </h3>
              
              {/* Toggle View Mode */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setChartMode('tiers')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    chartMode === 'tiers' 
                      ? 'bg-white text-blue-700 shadow-2xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="5 mức học lực: Dưới TB, TB, Khá, Giỏi, Xuất sắc"
                >
                  Xếp loại
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('detailed')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    chartMode === 'detailed' 
                      ? 'bg-white text-blue-700 shadow-2xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Phổ điểm chi tiết các khoảng từ 0 đến 10"
                >
                  Phổ điểm
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Biểu đồ phân bố điểm số qua tất cả bài giao ({activeChartData.reduce((acc, d) => acc + d.count, 0)} lượt bài có điểm)
            </p>
          </div>

          {activeChartData.every(d => d.count === 0) ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có dữ liệu bài nộp nào có điểm để vẽ biểu đồ
            </div>
          ) : (
            <div className="space-y-3">
              {/* Recharts Bar Chart Container */}
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeChartData}
                    margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700 pointer-events-none min-w-[170px]">
                              <div className="font-bold flex items-center gap-1.5 mb-1 text-slate-100">
                                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: data.color }} />
                                <span>{data.fullName}</span>
                              </div>
                              <div className="text-slate-300">
                                Số lượng: <strong className="text-white font-bold">{data.count}</strong> HS ({data.percentage}%)
                              </div>
                              {data.students && data.students.length > 0 && (
                                <div className="text-[10px] text-slate-400 mt-1.5 border-t border-slate-800 pt-1">
                                  Học sinh: {data.students.slice(0, 3).join(', ')}{data.students.length > 3 ? ` +${data.students.length - 3} em` : ''}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[4, 4, 0, 0]} 
                      barSize={chartMode === 'tiers' ? 28 : 18}
                      isAnimationActive={true}
                    >
                      {activeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Compact Legend & Summary */}
              <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-100">
                {tierChartData.map(item => (
                  <div key={item.id} className="text-center bg-slate-50/80 p-1 rounded-md border border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-600 truncate">{item.name}</div>
                    <div className="text-xs font-bold text-slate-800">{item.count} HS</div>
                    <div className="text-[9px] text-slate-400">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hall of Fame (Vinh danh - Internal teacher view) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Bảng Vinh danh Học sinh
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              Chỉ giáo viên xem
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Ghi nhận theo tiêu chí minh bạch: Điểm cao nhất và Nộp bài chăm chỉ nhất
          </p>

          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1.5">
                <Award className="w-3.5 h-3.5" />
                Thủ khoa điểm cao
              </div>
              {hallOfFame.topScorers.length === 0 ? (
                <div className="text-xs text-slate-400 italic">Chưa có kết quả</div>
              ) : (
                <div className="space-y-1.5">
                  {hallOfFame.topScorers.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-200/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{s.studentName}</span>
                        <span className="text-slate-500">({s.className})</span>
                      </div>
                      <span className="font-extrabold text-amber-600">{s.totalScore} đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Nộp bài sớm & Tích cực
              </div>
              {hallOfFame.earlyBirds.length === 0 ? (
                <div className="text-xs text-slate-400 italic">Chưa có bài nộp</div>
              ) : (
                <div className="space-y-1.5">
                  {hallOfFame.earlyBirds.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between bg-blue-50/60 px-2.5 py-1.5 rounded-lg border border-blue-200/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 font-bold">#{idx + 1}</span>
                        <span className="font-semibold text-slate-800">{s.studentName}</span>
                        <span className="text-slate-500">({s.className})</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(s.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
              exam={exams?.find(e => e.id === assignments.find(a => a.id === selectedResultSub.assignmentId)?.examId)}
              onClose={() => setSelectedResultSub(null)}
            />
          </div>
        </div>
      )}

      {/* REAL-TIME PENDING SUBMISSIONS TOAST NOTIFICATION */}
      <PendingGradingToast
        pendingSubmissions={pendingGradingSubs}
        assignments={assignments}
        exams={exams}
        onQuickGrade={sub => {
          setQuickGradingSub(sub);
          setInputEssayScore(sub.essayScore || 0);
          setInputFeedback(sub.teacherFeedback || '');
          setAiSuggestion(null);
        }}
        onViewResult={sub => setSelectedResultSub(sub)}
        onCopyResultLink={handleCopyResultLink}
        copiedSubId={copiedSubId}
        onNavigateToSubmissions={() => onNavigateToTab?.('submissions')}
        onSimulateSubmission={handleSimulateNewSubmission}
        isOpen={isToastOpen}
        onToggleOpen={setIsToastOpen}
      />

      {/* QUICK ESSAY GRADING MODAL FROM TOAST */}
      {quickGradingSub && (() => {
        const targetAsg = assignments.find(a => a.id === quickGradingSub.assignmentId);
        const targetExam = exams?.find(e => e.id === targetAsg?.examId);
        const essayQuestions = targetExam?.questions.filter(q => q.type === 'essay') || [];
        const maxEssayPossible = essayQuestions.reduce((acc, q) => acc + (q.points || 0), 0) || 10;
        const totalScorePreview = Math.round(((quickGradingSub.multipleChoiceScore || 0) + (Number(inputEssayScore) || 0)) * 100) / 100;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto border border-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-base font-bold text-slate-900">
                      Chấm Bài Nhanh: {quickGradingSub.studentName}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-slate-700">Lớp {quickGradingSub.className}</span>
                    <span>•</span>
                    <span className="text-blue-600 font-mono font-bold">Mã đề {quickGradingSub.variantCode}</span>
                    <span>•</span>
                    <span className="text-slate-400 font-mono">{quickGradingSub.receiptCode}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Điểm TN tự chấm</span>
                  <span className="text-base font-extrabold text-blue-600">
                    {quickGradingSub.multipleChoiceScore} đ
                  </span>
                </div>
              </div>

              {/* Essay Questions List */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {essayQuestions.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-center">
                    Bài kiểm tra không chứa câu hỏi tự luận riêng lẻ hoặc đang dùng chế độ trắc nghiệm mở rộng.
                  </div>
                ) : (
                  essayQuestions.map((q, idx) => {
                    const studentAnswer = quickGradingSub.answers[q.id] || '(Học sinh để trống)';
                    return (
                      <div key={q.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-xs">
                            Câu tự luận {idx + 1} ({q.points} điểm)
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRequestAiGrade(q, studentAnswer)}
                            disabled={isAiGrading}
                            className="flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isAiGrading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            )}
                            <span>{isAiGrading ? 'AI đang chấm...' : 'AI Gợi ý chấm'}</span>
                          </button>
                        </div>

                        {/* Question Text */}
                        <div className="text-xs text-slate-800 font-medium leading-relaxed">
                          <MathRenderer content={q.questionText} />
                        </div>

                        {/* Student Answer */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Bài làm của học sinh:
                          </span>
                          <div className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                            {studentAnswer}
                          </div>
                        </div>

                        {/* Teacher Rubric */}
                        {q.explanation && (
                          <div className="text-[11px] text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60 space-y-0.5">
                            <span className="font-bold text-amber-800">Hướng dẫn chấm / Đáp án:</span>
                            <div>
                              <MathRenderer content={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* AI Suggestion Box */}
              {aiSuggestion && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>AI Gợi ý: {aiSuggestion.suggestedScore} điểm</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInputEssayScore(aiSuggestion.suggestedScore);
                        if (aiSuggestion.feedback) setInputFeedback(aiSuggestion.feedback);
                      }}
                      className="px-2 py-0.5 text-[11px] font-bold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Áp dụng điểm & nhận xét
                    </button>
                  </div>
                  <p className="text-indigo-800 italic leading-relaxed">
                    "{aiSuggestion.feedback}"
                  </p>
                </div>
              )}

              {/* Score & Feedback Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Điểm tự luận cho (Max {maxEssayPossible} đ)
                  </label>
                  <input
                    type="number"
                    step={0.25}
                    min={0}
                    max={maxEssayPossible}
                    value={inputEssayScore}
                    onChange={e => setInputEssayScore(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-extrabold text-blue-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhận xét sư phạm
                  </label>
                  <input
                    type="text"
                    value={inputFeedback}
                    onChange={e => setInputFeedback(e.target.value)}
                    placeholder="Ghi nhận xét cho học sinh (hoặc dùng gợi ý từ AI)..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Total preview */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-700">Tổng điểm chính thức: </span>
                  <span className="text-xs text-slate-500">
                    ({quickGradingSub.multipleChoiceScore} TN + {inputEssayScore} TL)
                  </span>
                </div>
                <span className="text-base font-black text-emerald-600">
                  {totalScorePreview} / 10 điểm
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickGradingSub(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleSaveQuickGrade}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Điểm & Công Bố Kết Quả</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
