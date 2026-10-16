import React, { useState, useMemo } from 'react';
import { 
  Grid3X3, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  Eye,
  Save,
  Check,
  Loader2,
  FileText
} from 'lucide-react';
import { Matrix, MatrixTopic, Exam, Question, CognitiveLevel, QuestionType, LEVEL_LABELS } from '../types';
import { MathRenderer } from '../lib/mathRenderer';
import { ALL_CURRENT_SUBJECTS, CURRICULUM_SERIES, GRADE_LEVELS } from '../lib/subjects';

interface ModuleMatrixProps {
  matrices: Matrix[];
  onSaveMatrix: (matrix: Matrix) => Promise<void>;
  onSaveExam: (exam: Exam) => Promise<void>;
  onProceedToAssign: (exam: Exam) => void;
}

export const ModuleMatrix: React.FC<ModuleMatrixProps> = ({
  matrices,
  onSaveMatrix,
  onSaveExam,
  onProceedToAssign
}) => {
  // Wizard steps: 1 = Lap & Duyet ma tran, 2 = Tao de tu ma tran
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Matrix configuration state
  const [matrixTitle, setMatrixTitle] = useState('Ma trận Đề kiểm tra 45 phút - Chương III: Hàm số và Bất phương trình');
  const [subject, setSubject] = useState('Toán học');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [grade, setGrade] = useState('10');
  const [curriculum, setCurriculum] = useState(CURRICULUM_SERIES[0]);
  const [examType, setExamType] = useState('Kiểm tra 1 tiết (45 phút)');
  const [duration, setDuration] = useState(45);
  const [mcRatio, setMcRatio] = useState(70);
  const [essayRatio, setEssayRatio] = useState(30);

  // Topics in matrix
  const [topics, setTopics] = useState<MatrixTopic[]>([
    {
      id: 'tp_1',
      topicName: 'Hàm số và đồ thị hàm số bậc hai',
      recognition: 3,
      comprehension: 2,
      application: 1,
      highApplication: 0,
      pointsPerQuestion: 0.5,
      questionType: 'multiple_choice',
      specificationRequirement: 'Nhận biết đỉnh, trục đối xứng; Thông hiểu sự biến thiên; Vận dụng vẽ và giải bài toán thực tế đồ thị parabol.'
    },
    {
      id: 'tp_2',
      topicName: 'Dấu của tam thức bậc hai & Bất phương trình bậc hai',
      recognition: 2,
      comprehension: 2,
      application: 2,
      highApplication: 0,
      pointsPerQuestion: 0.5,
      questionType: 'multiple_choice',
      specificationRequirement: 'Nhận biết dấu tam thức dựa vào delta và hệ số a; Thông hiểu giải BPT bậc hai; Vận dụng bài toán điều kiện nghiệm.'
    },
    {
      id: 'tp_3',
      topicName: 'Ứng dụng thực tế & Bài toán chứa tham số m',
      recognition: 0,
      comprehension: 0,
      application: 1,
      highApplication: 1,
      pointsPerQuestion: 1.5,
      questionType: 'essay',
      specificationRequirement: 'Vận dụng định lý Vi-ét tìm tham số m thỏa mãn điều kiện; Vận dụng cao bài toán tối ưu thực tiễn (rào đất, cực trị).'
    }
  ]);

  const [matrixViewTab, setMatrixViewTab] = useState<'matrix' | 'spec'>('matrix');
  const [isMatrixApproved, setIsMatrixApproved] = useState(false);
  const [approvedMatrix, setApprovedMatrix] = useState<Matrix | null>(null);

  // Step 2 states: Exam generated from matrix
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<Exam | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Calculate totals
  const totalQuestions = useMemo(() => {
    return topics.reduce((sum, t) => sum + (t.recognition + t.comprehension + t.application + t.highApplication), 0);
  }, [topics]);

  const totalPoints = useMemo(() => {
    const raw = topics.reduce((sum, t) => {
      const qCount = t.recognition + t.comprehension + t.application + t.highApplication;
      return sum + qCount * t.pointsPerQuestion;
    }, 0);
    return Math.round(raw * 100) / 100;
  }, [topics]);

  const isTotalPointsValid = Math.abs(totalPoints - 10) < 0.05;

  // Add a new topic row
  const handleAddTopic = () => {
    const newTopic: MatrixTopic = {
      id: `tp_${Date.now()}`,
      topicName: 'Chủ đề mới',
      recognition: 1,
      comprehension: 1,
      application: 0,
      highApplication: 0,
      pointsPerQuestion: 0.5,
      questionType: 'multiple_choice'
    };
    setTopics([...topics, newTopic]);
  };

  // Update a topic field
  const handleUpdateTopic = (id: string, field: keyof MatrixTopic, val: any) => {
    setTopics(topics.map(t => t.id === id ? { ...t, [field]: val } : t));
    setIsMatrixApproved(false);
  };

  // Delete topic
  const handleDeleteTopic = (id: string) => {
    setTopics(topics.filter(t => t.id !== id));
    setIsMatrixApproved(false);
  };

  // Approve Matrix
  const handleApproveMatrix = async () => {
    if (!isTotalPointsValid) {
      alert(`Tổng điểm hiện tại là ${totalPoints}/10. Vui lòng điều chỉnh để tổng điểm đạt đúng 10 điểm!`);
      return;
    }

    const effectiveSubject = subject === 'Môn khác' && customSubjectName.trim() ? customSubjectName.trim() : subject;

    const matrix: Matrix = {
      id: `matrix_${Date.now()}`,
      teacherId: 'teacher_default_edunexa',
      title: matrixTitle,
      subject: effectiveSubject,
      grade,
      curriculum,
      examType,
      duration,
      totalScore: 10,
      totalQuestions,
      multipleChoiceRatio: mcRatio,
      essayRatio: essayRatio,
      topics,
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await onSaveMatrix(matrix);
    setApprovedMatrix(matrix);
    setIsMatrixApproved(true);
    setCurrentStep(2);

    // Automatically trigger exam generation for Step 2
    handleGenerateExam(matrix);
  };

  // Step 2: Generate exam from approved matrix
  const handleGenerateExam = async (matrix: Matrix) => {
    setIsGeneratingExam(true);
    try {
      const res = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: matrix.subject,
          grade: matrix.grade,
          curriculum: matrix.curriculum,
          topics: matrix.topics,
          totalScore: matrix.totalScore,
          additionalNotes: 'Bám sát tỉ lệ nhận thức và tạo công thức toán KaTeX chuẩn'
        })
      });
      const data = await res.json();
      const exam: Exam = {
        id: `exam_${Date.now()}`,
        teacherId: 'teacher_default_edunexa',
        matrixId: matrix.id,
        title: `Đề thi chuẩn ma trận: ${matrix.title}`,
        subject: matrix.subject,
        grade: matrix.grade,
        duration: matrix.duration,
        totalScore: 10,
        isApproved: false,
        status: 'draft',
        questions: data.questions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setGeneratedExam(exam);
    } catch (err) {
      console.error('Failed to generate exam:', err);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  // Save changes to single question in Step 2
  const handleSaveQuestionEdit = (updatedQ: Question) => {
    if (!generatedExam) return;
    const newQuestions = generatedExam.questions.map(q => q.id === updatedQ.id ? updatedQ : q);
    setGeneratedExam({ ...generatedExam, questions: newQuestions });
    setEditingQuestion(null);
  };

  // Final approval of Exam in Step 2
  const handleFinalApproveExam = async () => {
    if (!generatedExam) return;
    const finalExam: Exam = {
      ...generatedExam,
      isApproved: true,
      status: 'approved',
      updatedAt: new Date().toISOString()
    };
    await onSaveExam(finalExam);
    alert('Đề thi đã được duyệt thành công! Bạn có thể chuyển sang bước Giao bài & Trộn 10 mã đề.');
    onProceedToAssign(finalExam);
  };

  return (
    <div className="space-y-6">
      {/* Wizard Progress Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Quy Trình Tạo Đề Theo Chuẩn Ma Trận</h2>
            <p className="text-xs text-slate-500">
              Quy tắc sư phạm: Bắt buộc duyệt Ma trận trước → AI mới được phép sinh đề thi
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentStep === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
            <span>Bước 1: Lập & Duyệt Ma trận</span>
          </button>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

          <button
            onClick={() => {
              if (isMatrixApproved) setCurrentStep(2);
              else alert('Vui lòng duyệt ma trận trước khi chuyển sang Bước 2!');
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentStep === 2
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
            <span>Bước 2: Tạo & Duyệt Đề thi</span>
          </button>
        </div>
      </div>

      {/* STEP 1: LẬP VÀ DUYỆT MA TRẬN */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Metadata selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              1. Thông số & Đặc tả kỳ thi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Môn học ({ALL_CURRENT_SUBJECTS.length} môn)</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden font-medium"
                >
                  {ALL_CURRENT_SUBJECTS.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
                >
                  {GRADE_LEVELS.map(g => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bộ sách giáo khoa</label>
                <select
                  value={curriculum}
                  onChange={e => setCurriculum(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
                >
                  {CURRICULUM_SERIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loại bài thi & Thời gian</label>
                <div className="flex gap-2">
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value)}
                    className="w-2/3 text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
                  >
                    <option value="Bài tập về nhà">Bài tập về nhà</option>
                    <option value="Kiểm tra 15 phút">Kiểm tra 15 phút</option>
                    <option value="Kiểm tra 1 tiết (45 phút)">Kiểm tra 45 phút</option>
                    <option value="Giữa học kỳ">Giữa học kỳ</option>
                    <option value="Cuối học kỳ">Cuối học kỳ</option>
                  </select>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-1/3 text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
                    title="Thời gian làm bài (phút)"
                  />
                </div>
              </div>
            </div>

            {/* Custom Subject Name input if "Môn khác" is chosen */}
            {subject === 'Môn khác' && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                <label className="block text-xs font-bold text-purple-900">
                  ✨ Nhập tên Môn học khác tùy chọn:
                </label>
                <input
                  type="text"
                  required
                  value={customSubjectName}
                  onChange={e => setCustomSubjectName(e.target.value)}
                  placeholder="Ví dụ: Tiếng Pháp, Tiếng Hàn, Robot & STEM, Kỹ năng sống, Triết học..."
                  className="w-full text-xs p-2.5 border border-purple-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề Ma trận & Đề thi</label>
              <input
                type="text"
                value={matrixTitle}
                onChange={e => setMatrixTitle(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
              />
            </div>

            {/* Ratio Slider */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Tỷ lệ hình thức: {mcRatio}% Trắc nghiệm (A/B/C/D) – {essayRatio}% Tự luận</span>
                <span className="text-slate-400 font-normal">Thang điểm: 10 điểm</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={mcRatio}
                onChange={e => {
                  const val = Number(e.target.value);
                  setMcRatio(val);
                  setEssayRatio(100 - val);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* 2. Ma trận Chủ đề × 4 Mức độ nhận thức */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  2. Thiết Kế Ma Trận & Bản Đặc Tả Đề Thi (Bộ GD&ĐT)
                </h3>
                <p className="text-xs text-slate-500">
                  Chuẩn quy định chuyên môn: Ma trận 4 mức độ nhận thức kết hợp Bản đặc tả chi tiết yêu cầu cần đạt (YCCĐ)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View switcher */}
                <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMatrixViewTab('matrix')}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      matrixViewTab === 'matrix' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📊 Bảng Ma trận 4 mức độ
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixViewTab('spec')}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      matrixViewTab === 'spec' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📋 Bản đặc tả chi tiết (YCCĐ)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm chủ đề</span>
                </button>
              </div>
            </div>

            {/* TAB 1: BẢNG MA TRẬN 4 MỨC ĐỘ NHẬN THỨC */}
            {matrixViewTab === 'matrix' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">Chủ đề kiến thức</th>
                      <th className="p-3 text-center">Loại câu</th>
                      <th className="p-3 text-center bg-blue-50/70">Nhận biết</th>
                      <th className="p-3 text-center bg-blue-50/70">Thông hiểu</th>
                      <th className="p-3 text-center bg-indigo-50/70">Vận dụng</th>
                      <th className="p-3 text-center bg-indigo-50/70">Vận dụng cao</th>
                      <th className="p-3 text-center">Điểm / câu</th>
                      <th className="p-3 text-center">Tổng điểm</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {topics.map((t, idx) => {
                      const qCount = t.recognition + t.comprehension + t.application + t.highApplication;
                      const rowPoints = Math.round(qCount * t.pointsPerQuestion * 100) / 100;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-medium">
                            <input
                              type="text"
                              value={t.topicName}
                              onChange={e => handleUpdateTopic(t.id, 'topicName', e.target.value)}
                              className="w-full p-1 border border-slate-200 rounded bg-white font-medium text-xs focus:outline-hidden"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={t.questionType}
                              onChange={e => handleUpdateTopic(t.id, 'questionType', e.target.value as QuestionType)}
                              className="p-1 border border-slate-200 rounded bg-white text-xs focus:outline-hidden"
                            >
                              <option value="multiple_choice">Trắc nghiệm</option>
                              <option value="essay">Tự luận</option>
                              <option value="true_false">Đúng / Sai</option>
                              <option value="fill_blank">Điền khuyết</option>
                            </select>
                          </td>
                          <td className="p-3 text-center bg-blue-50/30">
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={t.recognition}
                              onChange={e => handleUpdateTopic(t.id, 'recognition', Number(e.target.value))}
                              className="w-12 text-center p-1 border border-slate-200 rounded bg-white text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-center bg-blue-50/30">
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={t.comprehension}
                              onChange={e => handleUpdateTopic(t.id, 'comprehension', Number(e.target.value))}
                              className="w-12 text-center p-1 border border-slate-200 rounded bg-white text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-center bg-indigo-50/30">
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={t.application}
                              onChange={e => handleUpdateTopic(t.id, 'application', Number(e.target.value))}
                              className="w-12 text-center p-1 border border-slate-200 rounded bg-white text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-center bg-indigo-50/30">
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={t.highApplication}
                              onChange={e => handleUpdateTopic(t.id, 'highApplication', Number(e.target.value))}
                              className="w-12 text-center p-1 border border-slate-200 rounded bg-white text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              step={0.1}
                              min={0.1}
                              max={5}
                              value={t.pointsPerQuestion}
                              onChange={e => handleUpdateTopic(t.id, 'pointsPerQuestion', Number(e.target.value))}
                              className="w-14 text-center p-1 border border-slate-200 rounded bg-white text-xs"
                            />
                          </td>
                          <td className="p-3 text-center font-bold text-blue-600">
                            {rowPoints} đ
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteTopic(t.id)}
                              disabled={topics.length <= 1}
                              className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-800 text-xs">
                    <tr>
                      <td className="p-3" colSpan={2}>Tổng cộng:</td>
                      <td className="p-3 text-center text-blue-700">
                        {topics.reduce((s, t) => s + t.recognition, 0)}
                      </td>
                      <td className="p-3 text-center text-blue-700">
                        {topics.reduce((s, t) => s + t.comprehension, 0)}
                      </td>
                      <td className="p-3 text-center text-indigo-700">
                        {topics.reduce((s, t) => s + t.application, 0)}
                      </td>
                      <td className="p-3 text-center text-indigo-700">
                        {topics.reduce((s, t) => s + t.highApplication, 0)}
                      </td>
                      <td className="p-3 text-center">
                        {totalQuestions} câu
                      </td>
                      <td className={`p-3 text-center text-sm font-extrabold ${isTotalPointsValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {totalPoints} / 10 đ
                      </td>
                      <td className="p-3 text-center">
                        {isTotalPointsValid ? (
                          <span className="flex items-center justify-center text-emerald-600 gap-1 text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Chuẩn 10đ
                          </span>
                        ) : (
                          <span className="flex items-center justify-center text-rose-600 gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Lệch {Math.round((totalPoints - 10) * 100) / 100}đ
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              /* TAB 2: BẢN ĐẶC TẢ CHI TIẾT MA TRẬN ĐỀ THI (YÊU CẦU CẦN ĐẠT - YCCĐ) */
              <div className="overflow-x-auto space-y-3">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3 w-12 text-center">TT</th>
                      <th className="p-3 w-48">Chủ đề / Đơn vị kiến thức</th>
                      <th className="p-3">Mức độ đánh giá & Yêu cầu cần đạt (YCCĐ)</th>
                      <th className="p-3 text-center w-28">Hình thức thi</th>
                      <th className="p-3 text-center w-24">Số câu</th>
                      <th className="p-3 text-center w-24">Điểm số</th>
                      <th className="p-3 text-center w-24">Tỷ lệ %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {topics.map((t, idx) => {
                      const qCount = t.recognition + t.comprehension + t.application + t.highApplication;
                      const rowPoints = Math.round(qCount * t.pointsPerQuestion * 100) / 100;
                      const percent = totalPoints > 0 ? Math.round((rowPoints / totalPoints) * 100) : 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {t.topicName}
                          </td>
                          <td className="p-3">
                            <textarea
                              rows={2}
                              value={t.specificationRequirement || ''}
                              placeholder="Nhập yêu cầu cần đạt (YCCĐ) theo chương trình GDPT 2018..."
                              onChange={e => handleUpdateTopic(t.id, 'specificationRequirement' as any, e.target.value)}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white focus:outline-hidden"
                            />
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-1">
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                NB: {t.recognition} câu
                              </span>
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                TH: {t.comprehension} câu
                              </span>
                              <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                VD: {t.application} câu
                              </span>
                              <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                VDC: {t.highApplication} câu
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                              {t.questionType === 'multiple_choice' ? 'Trắc nghiệm' : t.questionType === 'essay' ? 'Tự luận' : 'Đúng/Sai'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">
                            {qCount} câu
                          </td>
                          <td className="p-3 text-center font-bold text-blue-600">
                            {rowPoints} đ
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-600">
                            {percent}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-800 text-xs">
                    <tr>
                      <td className="p-3 text-center" colSpan={4}>
                        Tổng cộng toàn bản đặc tả:
                      </td>
                      <td className="p-3 text-center text-blue-700 font-bold">
                        {totalQuestions} câu
                      </td>
                      <td className="p-3 text-center text-blue-700 font-bold">
                        {totalPoints} đ
                      </td>
                      <td className="p-3 text-center text-emerald-700 font-bold">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Validation bar and Approval Button */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs">
                {isTotalPointsValid ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Ma trận đạt chuẩn: Tổng số câu {totalQuestions}, đúng 10.0 điểm, sẵn sàng duyệt!
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Cần điều chỉnh điểm/số câu sao cho tổng điểm bằng 10.0 điểm (hiện tại: {totalPoints}đ).
                  </span>
                )}
              </div>

              <button
                onClick={handleApproveMatrix}
                disabled={!isTotalPointsValid}
                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận & Duyệt Ma Trận</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: TẠO ĐỀ TỪ MA TRẬN ĐÃ DUYỆT */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Ma trận đã duyệt: {matrixTitle}
                </span>
                <span className="text-[11px] text-emerald-700">
                  {totalQuestions} câu • Thang 10 điểm • Môn {subject} {grade}
                </span>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-blue-700 font-bold hover:underline"
            >
              Chỉnh sửa lại ma trận
            </button>
          </div>

          {isGeneratingExam ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                AI đang biên soạn câu hỏi bám sát ma trận và định dạng KaTeX...
              </h4>
              <p className="text-xs text-slate-500">
                Đang xử lý phân bố nhận thức và tạo đáp án chuẩn cho giáo viên kiểm tra
              </p>
            </div>
          ) : generatedExam ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Bản thảo Đề thi: {generatedExam.questions.length} câu hỏi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Giáo viên kiểm tra từng câu hỏi, công thức toán và đáp án chuẩn trước khi bấm Duyệt đề
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => approvedMatrix && handleGenerateExam(approvedMatrix)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tạo lại bộ câu khác</span>
                  </button>

                  <button
                    onClick={handleFinalApproveExam}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Duyệt Đề & Chuyển sang Giao bài</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {generatedExam.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-blue-600 text-sm">
                          Câu {q.number}:
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {q.topic}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {LEVEL_LABELS[q.level]}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({q.points} điểm)
                        </span>
                      </div>

                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="flex items-center space-x-1 text-slate-400 hover:text-blue-600 text-xs font-semibold p-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa câu</span>
                      </button>
                    </div>

                    {/* Question Text with KaTeX */}
                    <div className="text-slate-800 text-sm font-medium leading-relaxed pl-1">
                      <MathRenderer content={q.questionText} />
                    </div>

                    {/* Options if MC */}
                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-1">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = opt.id === q.correctOptionId;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center space-x-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <div className="flex-1">
                                <MathRenderer content={opt.text} />
                              </div>
                              {isCorrect && (
                                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-600 border border-slate-200">
                        <span className="font-bold text-slate-700">Lời giải / Hướng dẫn chấm: </span>
                        <MathRenderer content={q.explanation} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-xl space-y-4 my-8">
            <h4 className="text-base font-bold text-slate-800">Chỉnh sửa Câu {editingQuestion.number}</h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi (chèn công thức bằng $...$):</label>
              <textarea
                value={editingQuestion.questionText}
                onChange={e => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
              />
            </div>

            {editingQuestion.options && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Các phương án lựa chọn:</label>
                {editingQuestion.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <span className="w-6 text-xs font-bold text-slate-600">{String.fromCharCode(65 + i)}:</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => {
                        const newOpts = [...(editingQuestion.options || [])];
                        newOpts[i] = { ...opt, text: e.target.value };
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      className="flex-1 text-xs p-2 border border-slate-200 rounded bg-slate-50"
                    />
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={editingQuestion.correctOptionId === opt.id}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctOptionId: opt.id })}
                      className="accent-emerald-600"
                      title="Chọn làm đáp án đúng"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lời giải chi tiết:</label>
              <textarea
                value={editingQuestion.explanation || ''}
                onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                rows={2}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => handleSaveQuestionEdit(editingQuestion)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Lưu câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
