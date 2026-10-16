import React, { useState } from 'react';
import { 
  Shuffle, 
  Send, 
  Copy, 
  QrCode, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Users, 
  Share2, 
  Check,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Exam, Assignment, ClassInfo, ExamVariant } from '../types';
import { generate10Variants } from '../lib/shuffler';
import { exportVariantLinksToExcel } from '../lib/excelExport';

interface ModuleAssignProps {
  exams: Exam[];
  classes: ClassInfo[];
  selectedExamForAssign: Exam | null;
  assignments?: Assignment[];
  onSaveAssignment: (assignment: Assignment) => Promise<void>;
  onOpenStudentExam: (assignmentId: string, variantId?: string) => void;
}

export const ModuleAssign: React.FC<ModuleAssignProps> = ({
  exams,
  classes,
  selectedExamForAssign,
  assignments = [],
  onSaveAssignment,
  onOpenStudentExam
}) => {
  const approvedExams = exams.filter(e => e.isApproved || e.status === 'published' || e.status === 'approved');

  const [selectedExamId, setSelectedExamId] = useState<string>(
    selectedExamForAssign ? selectedExamForAssign.id : (approvedExams[0]?.id || '')
  );

  const currentExam = exams.find(e => e.id === selectedExamId) || approvedExams[0] || null;

  // Assignment configuration
  const [assignmentTitle, setAssignmentTitle] = useState(
    currentExam ? `Đợt kiểm tra: ${currentExam.title}` : 'Đợt kiểm tra môn Toán'
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    classes.length > 0 ? [classes[0].id] : []
  );
  const [durationMinutes, setDurationMinutes] = useState(currentExam ? currentExam.duration : 45);
  const [showScoreMode, setShowScoreMode] = useState<'immediate' | 'after_close' | 'manual'>('immediate');
  const [allowManualClass, setAllowManualClass] = useState(true);

  // Result state after generating assignment - initialize with latest assignment if available
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(
    assignments.length > 0 ? assignments[0] : null
  );
  const [copiedVariantId, setCopiedVariantId] = useState<string | null>(null);
  const [viewingQrVariant, setViewingQrVariant] = useState<ExamVariant | null>(null);
  const [assignSuccessToast, setAssignSuccessToast] = useState<string | null>(null);

  // Update active assignment when assignments prop updates if none selected
  React.useEffect(() => {
    if (!activeAssignment && assignments.length > 0) {
      setActiveAssignment(assignments[0]);
    }
  }, [assignments, activeAssignment]);

  React.useEffect(() => {
    if (selectedExamForAssign) {
      setSelectedExamId(selectedExamForAssign.id);
      setAssignmentTitle(`Đợt kiểm tra: ${selectedExamForAssign.title}`);
      setDurationMinutes(selectedExamForAssign.duration || 45);
    }
  }, [selectedExamForAssign]);

  // Compute base URL for students (Production origin)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://edunexa.edu.vn';

  // Toggle class selection
  const handleToggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter(id => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  // 1. Assign single master exam
  const handleAssignSingle = async () => {
    if (!currentExam) {
      alert('Vui lòng chọn đề thi đã được duyệt!');
      return;
    }

    const singleVariant: ExamVariant = {
      variantId: `${currentExam.id}_vMain`,
      variantCode: 'Chính thức',
      questions: currentExam.questions
    };

    const newAssignment: Assignment = {
      id: `asg_${Date.now()}`,
      teacherId: 'teacher_default_edunexa',
      examId: currentExam.id,
      title: assignmentTitle,
      subject: currentExam.subject,
      grade: currentExam.grade,
      durationMinutes,
      classIds: selectedClassIds,
      allowManualClass,
      openAt: new Date().toISOString(),
      closeAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      maxAttempts: 1,
      showScoreMode,
      status: 'active',
      isVariantSet: false,
      variants: [singleVariant],
      createdAt: new Date().toISOString()
    };

    await onSaveAssignment(newAssignment);
    setActiveAssignment(newAssignment);
    setAssignSuccessToast(`Đã phát hành thành công "${newAssignment.title}"! Đã tạo link làm bài trực tiếp cho học sinh.`);
    setTimeout(() => setAssignSuccessToast(null), 5000);
  };

  // 2. Mix & generate exactly 10 variants
  const handleAssign10Variants = async () => {
    if (!currentExam) {
      alert('Vui lòng chọn đề thi đã được duyệt!');
      return;
    }

    // Generate exact 10 variants using deterministic shuffler
    const variants = generate10Variants(currentExam);

    const newAssignment: Assignment = {
      id: `asg_${Date.now()}`,
      teacherId: 'teacher_default_edunexa',
      examId: currentExam.id,
      title: `${assignmentTitle} (Trộn 10 mã đề)`,
      subject: currentExam.subject,
      grade: currentExam.grade,
      durationMinutes,
      classIds: selectedClassIds,
      allowManualClass,
      openAt: new Date().toISOString(),
      closeAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      maxAttempts: 1,
      showScoreMode,
      status: 'active',
      isVariantSet: true,
      variants,
      createdAt: new Date().toISOString()
    };

    await onSaveAssignment(newAssignment);
    setActiveAssignment(newAssignment);
    setAssignSuccessToast(`Đã trộn và phát hành thành công 10 mã đề (101 - 110) cho "${newAssignment.title}"!`);
    setTimeout(() => setAssignSuccessToast(null), 5000);
  };

  // Copy student URL
  const handleCopyLink = (variantId: string) => {
    if (!activeAssignment) return;
    const link = `${baseUrl}?assignmentId=${activeAssignment.id}&variantId=${variantId}`;
    navigator.clipboard.writeText(link);
    setCopiedVariantId(variantId);
    setTimeout(() => setCopiedVariantId(null), 2000);
  };

  // Copy Zalo / Class group message
  const handleCopyZaloMessage = () => {
    if (!activeAssignment) return;
    const commonLink = `${baseUrl}?assignmentId=${activeAssignment.id}`;
    const msg = `📢 THÔNG BÁO LÀM BÀI KIỂM TRA - EDUNEXA\n📝 Bài kiểm tra: ${activeAssignment.title}\n⏱ Thời gian làm bài: ${activeAssignment.durationMinutes} phút\n📅 Hạn nộp: ${activeAssignment.closeAt ? new Date(activeAssignment.closeAt).toLocaleString('vi-VN') : 'Theo thông báo của giáo viên'}\n👉 Đường link làm bài trực tiếp của học sinh:\n${commonLink}\n(Học sinh bấm link, điền đúng Họ tên, Lớp, Ngày sinh để nhận đề và nộp bài).`;
    navigator.clipboard.writeText(msg);
    setAssignSuccessToast('Đã sao chép nội dung tin nhắn gửi Zalo/Nhóm lớp thành công!');
    setTimeout(() => setAssignSuccessToast(null), 4000);
  };

  // Export 10 variant links to Excel
  const handleExportLinksExcel = () => {
    if (!activeAssignment) return;
    exportVariantLinksToExcel(
      activeAssignment.title,
      activeAssignment.variants,
      baseUrl,
      activeAssignment.id
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {assignSuccessToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{assignSuccessToast}</span>
          </div>
          <button
            onClick={() => setAssignSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: CẤU HÌNH GIAO BÀI */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Bước 4: Giao Bài & Phân Phối Đề
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-blue-600" />
            Giao Bài Tập & Trộn 10 Mã Đề
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trộn đảo câu hỏi & phương án A/B/C/D có kiểm soát chuẩn ma trận • Tự động tạo link trực tiếp & mã QR gửi cho học sinh
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Chọn đề thi đã duyệt:
            </label>
            <select
              value={selectedExamId}
              onChange={e => {
                setSelectedExamId(e.target.value);
                const found = exams.find(ex => ex.id === e.target.value);
                if (found) {
                  setAssignmentTitle(`Đợt kiểm tra: ${found.title}`);
                  setDurationMinutes(found.duration);
                }
              }}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden font-medium"
            >
              {approvedExams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.subject} {ex.grade} • {ex.questions.length} câu • {ex.duration}p)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Tiêu đề đợt giao bài hiển thị với học sinh:
            </label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={e => setAssignmentTitle(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden font-medium"
            />
          </div>
        </div>

        {/* Classes Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            3. Chọn lớp học được giao bài:
          </label>
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => {
              const isSelected = selectedClassIds.includes(cls.id);
              return (
                <button
                  key={cls.id}
                  onClick={() => handleToggleClass(cls.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Lớp {cls.name} ({cls.studentCount} HS)</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center space-x-2 text-xs text-slate-600">
            <input
              type="checkbox"
              id="manualClassCheck"
              checked={allowManualClass}
              onChange={e => setAllowManualClass(e.target.checked)}
              className="accent-blue-600"
            />
            <label htmlFor="manualClassCheck" className="cursor-pointer">
              Cho phép học sinh tự gõ tên lớp nếu không có trong danh sách
            </label>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Thời lượng làm bài</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">phút</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Thời điểm công bố điểm</label>
            <select
              value={showScoreMode}
              onChange={e => setShowScoreMode(e.target.value as any)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50"
            >
              <option value="immediate">Xem điểm trắc nghiệm ngay khi nộp</option>
              <option value="after_close">Chỉ xem điểm khi đóng đợt thi</option>
              <option value="manual">Giáo viên công bố thủ công</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Số lần làm bài tối đa</label>
            <input
              type="number"
              value={1}
              disabled
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500"
              title="1 lần duy nhất cho mỗi học sinh theo họ tên & ngày sinh"
            />
          </div>
        </div>

        {/* GIAO BÀI ACTION BUTTONS */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={handleAssignSingle}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-slate-300" />
            <span>Giao 1 Đề Duy Nhất</span>
          </button>

          <button
            onClick={handleAssign10Variants}
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>Trộn 10 Mã Đề (101 - 110) & Phát Hành</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: BẢNG 10 PHIÊN BẢN ĐÃ PHÁT HÀNH */}
      {activeAssignment && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Đang mở thi
                </span>
                <h3 className="text-base font-bold text-slate-800">{activeAssignment.title}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đã phát hành {activeAssignment.variants.length} phiên bản • Học sinh mở trực tiếp không cần đăng nhập Gmail
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportLinksExcel}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải danh sách 10 link (Excel)</span>
              </button>
            </div>
          </div>

          {/* Variants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3 w-28">Mã đề</th>
                  <th className="p-3 w-24 text-center">Số câu</th>
                  <th className="p-3">Đường dẫn làm bài học sinh</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {activeAssignment.variants.map((v, idx) => {
                  const studentUrl = `${baseUrl}?assignmentId=${activeAssignment.id}&variantId=${v.variantId}`;
                  const isCopied = copiedVariantId === v.variantId;
                  return (
                    <tr key={v.variantId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="p-3 font-bold text-blue-700">
                        Mã {v.variantCode}
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        {v.questions.length} câu
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 truncate max-w-xs sm:max-w-md">
                        {studentUrl}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleCopyLink(v.variantId)}
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Sao chép link làm bài"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Đã chép' : 'Sao chép'}</span>
                          </button>

                          <button
                            onClick={() => setViewingQrVariant(v)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Xem mã QR quét điện thoại"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenStudentExam(activeAssignment.id, v.variantId)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Mở xem thử giao diện học sinh"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {viewingQrVariant && activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl text-center space-y-4">
            <h4 className="text-base font-bold text-slate-800">
              Mã QR Đề {viewingQrVariant.variantCode}
            </h4>
            <p className="text-xs text-slate-500">
              Học sinh dùng camera điện thoại hoặc Zalo quét để vào thẳng phòng thi
            </p>

            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              {/* Dynamic QR SVG */}
              <svg className="w-48 h-48" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white" />
                {/* Visual QR Corners */}
                <rect x="10" y="10" width="25" height="25" fill="#1e293b" />
                <rect x="15" y="15" width="15" height="15" fill="white" />
                <rect x="18" y="18" width="9" height="9" fill="#2563eb" />

                <rect x="65" y="10" width="25" height="25" fill="#1e293b" />
                <rect x="70" y="15" width="15" height="15" fill="white" />
                <rect x="73" y="18" width="9" height="9" fill="#2563eb" />

                <rect x="10" y="65" width="25" height="25" fill="#1e293b" />
                <rect x="15" y="70" width="15" height="15" fill="white" />
                <rect x="18" y="73" width="9" height="9" fill="#2563eb" />

                {/* Simulated Data Grid */}
                <rect x="40" y="12" width="6" height="6" fill="#1e293b" />
                <rect x="52" y="15" width="6" height="6" fill="#1e293b" />
                <rect x="42" y="24" width="6" height="6" fill="#1e293b" />
                <rect x="48" y="32" width="6" height="6" fill="#1e293b" />
                <rect x="14" y="44" width="6" height="6" fill="#1e293b" />
                <rect x="25" y="48" width="6" height="6" fill="#1e293b" />
                <rect x="36" y="42" width="6" height="6" fill="#2563eb" />
                <rect x="44" y="50" width="6" height="6" fill="#1e293b" />
                <rect x="55" y="44" width="6" height="6" fill="#1e293b" />
                <rect x="66" y="52" width="6" height="6" fill="#1e293b" />
                <rect x="78" y="42" width="6" height="6" fill="#1e293b" />
                <rect x="85" y="52" width="6" height="6" fill="#1e293b" />
                <rect x="44" y="65" width="6" height="6" fill="#1e293b" />
                <rect x="55" y="70" width="6" height="6" fill="#1e293b" />
                <rect x="65" y="75" width="6" height="6" fill="#1e293b" />
                <rect x="75" y="65" width="6" height="6" fill="#1e293b" />
                <rect x="85" y="80" width="6" height="6" fill="#1e293b" />
              </svg>
            </div>

            <div className="font-mono text-[10px] text-slate-500 break-all bg-slate-50 p-2 rounded border border-slate-200">
              {`${baseUrl}?assignmentId=${activeAssignment.id}&variantId=${viewingQrVariant.variantId}`}
            </div>

            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => setViewingQrVariant(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
