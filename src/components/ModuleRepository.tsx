import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, 
  FileSpreadsheet, 
  Bot, 
  Download, 
  Upload, 
  Search, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Sparkles,
  Layers,
  BookOpen,
  ArrowRight,
  Loader2,
  FileText,
  Eye,
  X,
  Check,
  FolderPlus,
  ExternalLink,
  Library,
  BookCheck,
  FileUp
} from 'lucide-react';
import { Exam, Question, CognitiveLevel, QuestionType, TextbookPdf } from '../types';
import { MathRenderer } from '../lib/mathRenderer';
import { downloadSampleQuestionBankTemplate, parseQuestionBankExcel } from '../lib/excelExport';
import { ALL_CURRENT_SUBJECTS, CURRICULUM_SERIES, GRADE_LEVELS } from '../lib/subjects';
import { INITIAL_TEXTBOOKS } from '../lib/seedData';

interface ModuleRepositoryProps {
  exams: Exam[];
  onSaveExam: (exam: Exam) => Promise<void>;
  onDeleteExam: (examId: string) => Promise<void>;
  onSelectExamForAssignment: (exam: Exam) => void;
  onNavigateToMatrix: () => void;
  textbooks?: TextbookPdf[];
  onSaveTextbook?: (tb: TextbookPdf) => Promise<void>;
  onDeleteTextbook?: (id: string) => Promise<void>;
}

export const ModuleRepository: React.FC<ModuleRepositoryProps> = ({
  exams,
  onSaveExam,
  onDeleteExam,
  onSelectExamForAssignment,
  onNavigateToMatrix,
  textbooks: initialTextbooks,
  onSaveTextbook,
  onDeleteTextbook
}) => {
  // 3 Ways / Sources to get test content
  const [activeSourceTab, setActiveSourceTab] = useState<'A' | 'B' | 'C'>('A');

  // Exam repository filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Textbooks state inside Repository (strictly deduplicated)
  const [localTextbooks, setLocalTextbooks] = useState<TextbookPdf[]>(() => {
    if (!initialTextbooks) return [];
    const map = new Map<string, TextbookPdf>();
    initialTextbooks.forEach(b => {
      if (b && b.id) map.set(b.id, b);
    });
    return Array.from(map.values());
  });

  useEffect(() => {
    if (!initialTextbooks) {
      setLocalTextbooks([]);
      return;
    }
    const map = new Map<string, TextbookPdf>();
    initialTextbooks.forEach(b => {
      if (b && b.id) map.set(b.id, b);
    });
    setLocalTextbooks(Array.from(map.values()));
  }, [initialTextbooks]);

  // Batch PDF SGK Upload Modal State
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [batchSubject, setBatchSubject] = useState('Toán học');
  const [customBatchSubject, setCustomBatchSubject] = useState('');
  const [batchGrade, setBatchGrade] = useState('10');
  const [batchCurriculum, setBatchCurriculum] = useState(CURRICULUM_SERIES[0]);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [batchUploadSuccess, setBatchUploadSuccess] = useState<string | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);

  // PDF Viewer Modal
  const [viewingBook, setViewingBook] = useState<TextbookPdf | null>(null);

  // SGK Library filter in Source A
  const [sgkFilterSubject, setSgkFilterSubject] = useState('all');
  const [sgkFilterGrade, setSgkFilterGrade] = useState('all');

  // Source A states (SGK / Photo / Doc / PDF extraction)
  const [sourceAText, setSourceAText] = useState('');
  const [sourceAFiles, setSourceAFiles] = useState<Array<{ mimeType: string; data: string; preview: string; name?: string }>>([]);
  const [selectedBookForExtraction, setSelectedBookForExtraction] = useState<TextbookPdf | null>(null);
  const [isExtractingA, setIsExtractingA] = useState(false);
  const [extractedSnippetA, setExtractedSnippetA] = useState('');
  const [extractedQuestionsA, setExtractedQuestionsA] = useState<Question[]>([]);

  // Source B states (Excel/DOCX)
  const fileInputRefB = useRef<HTMLInputElement | null>(null);
  const [isImportingB, setIsImportingB] = useState(false);
  const [importedQuestionsB, setImportedQuestionsB] = useState<Question[]>([]);

  // Source C states (AI Generation)
  const [sourceCSubject, setSourceCSubject] = useState('Toán học');
  const [customSourceCSubject, setCustomSourceCSubject] = useState('');
  const [sourceCGrade, setSourceCGrade] = useState('10');
  const [sourceCTopic, setSourceCTopic] = useState('Hàm số bậc hai và đồ thị parabol');
  const [sourceCCount, setSourceCCount] = useState(6);
  const [sourceCNotes, setSourceCNotes] = useState('Ưu tiên 4 câu trắc nghiệm và 2 câu tự luận thực tế');
  const [isGeneratingC, setIsGeneratingC] = useState(false);
  const [generatedQuestionsC, setGeneratedQuestionsC] = useState<Question[]>([]);

  // Modal confirm delete & inspecting exam
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [inspectingExam, setInspectingExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Filter exams
  const filteredExams = exams.filter(e => {
    if (filterSubject !== 'all' && e.subject !== filterSubject) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (searchQuery.trim() && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filter SGK books in Tab A - strictly deduplicated by id
  const filteredSgkBooks = useMemo(() => {
    const map = new Map<string, TextbookPdf>();
    localTextbooks.forEach(b => {
      if (!b || !b.id) return;
      if (sgkFilterSubject !== 'all') {
        const eff = b.subject === 'Môn khác' && b.customSubjectName ? b.customSubjectName : b.subject;
        if (eff !== sgkFilterSubject && b.subject !== sgkFilterSubject) return;
      }
      if (sgkFilterGrade !== 'all' && b.grade !== sgkFilterGrade) return;
      map.set(b.id, b);
    });
    return Array.from(map.values());
  }, [localTextbooks, sgkFilterSubject, sgkFilterGrade]);

  // Handle multiple PDF files selection for batch upload
  const handleSelectBatchFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validPdfs: File[] = [];
    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        validPdfs.push(file);
      }
    });

    if (validPdfs.length < files.length) {
      alert(`Đã chọn ${validPdfs.length} file PDF hợp lệ. Một số file không phải PDF đã được bỏ qua.`);
    }

    setBatchFiles(prev => [...prev, ...validPdfs]);
  };

  const removeBatchFile = (index: number) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number | string | undefined) => {
    if (typeof bytes === 'string') return bytes;
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Submit Batch PDF upload
  const handleSubmitBatchUpload = async () => {
    if (batchFiles.length === 0) {
      alert('Vui lòng chọn ít nhất 1 file PDF SGK để tải lên!');
      return;
    }

    const effectiveSubject = batchSubject === 'Môn khác' && customBatchSubject.trim()
      ? customBatchSubject.trim()
      : batchSubject;

    setIsUploadingBatch(true);

    try {
      const newlyCreatedBooks: TextbookPdf[] = [];

      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        const objUrl = URL.createObjectURL(file);

        const newBook: TextbookPdf = {
          id: `user_sgk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${i}`,
          title: cleanTitle,
          subject: batchSubject,
          customSubjectName: batchSubject === 'Môn khác' ? customBatchSubject.trim() : undefined,
          grade: batchGrade,
          curriculum: batchCurriculum,
          volume: 'Sách giáo khoa',
          fileName: file.name,
          pageCount: 120 + Math.floor(Math.random() * 60),
          fileSize: file.size,
          fileUrl: objUrl,
          description: `Sách giáo khoa môn ${effectiveSubject} Lớp ${batchGrade} - Bộ sách ${batchCurriculum}. Đã sẵn sàng trích xuất đề thi.`,
          uploadedAt: new Date().toISOString()
        };

        if (onSaveTextbook) {
          await onSaveTextbook(newBook);
        }
        newlyCreatedBooks.push(newBook);
      }

      setLocalTextbooks(prev => {
        const map = new Map<string, TextbookPdf>();
        prev.forEach(b => { if (b?.id) map.set(b.id, b); });
        newlyCreatedBooks.forEach(b => { if (b?.id) map.set(b.id, b); });
        return Array.from(map.values());
      });
      setBatchUploadSuccess(`Đã tải lên thành công ${newlyCreatedBooks.length} file PDF SGK!`);
      setBatchFiles([]);

      setTimeout(() => {
        setIsBatchUploadOpen(false);
        setBatchUploadSuccess(null);
      }, 1200);
    } catch (err) {
      console.error('Batch upload error:', err);
      alert('Có lỗi xảy ra trong quá trình tải file. Vui lòng thử lại!');
    } finally {
      setIsUploadingBatch(false);
    }
  };

  // Handle immediate files upload in Tab A (photo or PDF)
  const handleFileUploadA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const reader = new FileReader();
      reader.onload = () => {
        const fullData = reader.result as string;
        const base64 = fullData.split(',')[1] || '';
        setSourceAFiles(prev => [
          ...prev,
          {
            mimeType: isPdf ? 'application/pdf' : (file.type || 'image/jpeg'),
            data: base64,
            preview: isPdf ? 'pdf' : fullData,
            name: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Select a textbook from library for instant AI extraction
  const handleSelectBookForExtraction = (book: TextbookPdf) => {
    setSelectedBookForExtraction(book);
    const effSub = book.subject === 'Môn khác' && book.customSubjectName ? book.customSubjectName : book.subject;
    setSourceAText(`[Trích xuất từ Sách: ${book.title} - Môn: ${effSub} Lớp ${book.grade} (${book.curriculum})]\nNhiệm vụ: Trích xuất các câu hỏi trắc nghiệm và bài tập tự luận trọng tâm trong chương trình sách giáo khoa này kèm đáp án và lời giải chi tiết chuẩn Bộ GD&ĐT.`);
    setActiveSourceTab('A');
  };

  // Source A: Call AI Extraction API
  const handleExtractA = async () => {
    if (!sourceAText && sourceAFiles.length === 0 && !selectedBookForExtraction) return;
    setIsExtractingA(true);

    const effSub = selectedBookForExtraction 
      ? (selectedBookForExtraction.subject === 'Môn khác' && selectedBookForExtraction.customSubjectName ? selectedBookForExtraction.customSubjectName : selectedBookForExtraction.subject)
      : 'Toán học';
    const grade = selectedBookForExtraction?.grade || '10';
    const bookTitle = selectedBookForExtraction?.title || '';

    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: sourceAText,
          files: sourceAFiles.map(f => ({ mimeType: f.mimeType, data: f.data, name: f.name })),
          subject: effSub,
          grade,
          bookTitle
        })
      });
      const data = await res.json();
      setExtractedSnippetA(data.textSnippet || 'Đã trích xuất học liệu thành công');
      setExtractedQuestionsA(data.extractedQuestions || []);
    } catch (err) {
      console.error('Extract error:', err);
    } finally {
      setIsExtractingA(false);
    }
  };

  // Source B: Handle Excel upload
  const handleFileUploadB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingB(true);
    try {
      const questions = await parseQuestionBankExcel(file);
      setImportedQuestionsB(questions);
    } catch (err) {
      console.error('Import error:', err);
      alert('Không thể đọc tệp Excel. Vui lòng đảm bảo đúng định dạng mẫu!');
    } finally {
      setIsImportingB(false);
    }
  };

  // Source C: AI generate directly
  const handleGenerateC = async () => {
    setIsGeneratingC(true);
    const effectiveSubject = sourceCSubject === 'Môn khác' && customSourceCSubject.trim()
      ? customSourceCSubject.trim()
      : sourceCSubject;

    try {
      const res = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: effectiveSubject,
          grade: sourceCGrade,
          curriculum: 'Kết nối tri thức',
          topics: [
            {
              id: 'tp_custom',
              topicName: sourceCTopic,
              recognition: Math.floor(sourceCCount * 0.4),
              comprehension: Math.floor(sourceCCount * 0.3),
              application: Math.max(1, Math.floor(sourceCCount * 0.2)),
              highApplication: Math.max(0, sourceCCount - Math.floor(sourceCCount * 0.4) - Math.floor(sourceCCount * 0.3) - Math.floor(sourceCCount * 0.2)),
              pointsPerQuestion: Math.round((10 / sourceCCount) * 10) / 10,
              questionType: 'multiple_choice'
            }
          ],
          totalScore: 10,
          additionalNotes: sourceCNotes
        })
      });
      const data = await res.json();
      setGeneratedQuestionsC(data.questions || []);
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setIsGeneratingC(false);
    }
  };

  // Convert extracted questions to a new Exam
  const handleSaveQuestionsAsExam = async (questions: Question[], title: string, subject: string, grade: string) => {
    if (questions.length === 0) return;
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      teacherId: 'teacher_default_edunexa',
      title,
      subject,
      grade,
      duration: 45,
      totalScore: 10,
      isApproved: true,
      status: 'approved',
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await onSaveExam(newExam);
    alert(`Đã lưu thành công đề thi "${title}" vào Kho đề!`);
  };

  // Clone exam
  const handleCloneExam = async (exam: Exam) => {
    const cloned: Exam = {
      ...exam,
      id: `exam_clone_${Date.now()}`,
      title: `${exam.title} (Bản sao)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await onSaveExam(cloned);
  };

  // Delete textbook
  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sách này khỏi kho?')) return;
    if (onDeleteTextbook) {
      await onDeleteTextbook(bookId);
    }
    setLocalTextbooks(prev => prev.filter(b => b.id !== bookId));
  };

  // Clear all textbooks from library
  const handleClearAllBooks = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả các file có sẵn trong kho SGK? Thao tác này sẽ làm sạch kho để bạn tự tải các file tài liệu mới lên.')) return;
    if (onDeleteTextbook) {
      await Promise.all(localTextbooks.map(b => onDeleteTextbook(b.id).catch(() => {})));
    }
    setLocalTextbooks([]);
    setSelectedBookForExtraction(null);
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: 3 WAYS / SOURCES CARDS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                Bước 2: Kho Nguồn Tài Liệu & Đề Thi
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Kho SGK: {localTextbooks.length} sách PDF
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Tải Tài Liệu & Lấy Nguồn Câu Hỏi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ tải nhiều file SGK (.PDF), file ảnh chụp câu hỏi, hoặc file Excel kho đề theo đúng chuẩn quy trình khảo thí
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* PROMINENT BUTTON: TẢI NHIỀU FILE SGK */}
            <button
              onClick={() => setIsBatchUploadOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <FileUp className="w-4 h-4 text-white" />
              <span>Tải nhiều file SGK (.PDF)</span>
            </button>

            {/* Source Tab Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-lg space-x-1">
              <button
                onClick={() => setActiveSourceTab('A')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSourceTab === 'A'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>1. File SGK (PDF)</span>
              </button>
              <button
                onClick={() => setActiveSourceTab('B')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSourceTab === 'B'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>2. File Excel / Ngân hàng</span>
              </button>
              <button
                onClick={() => setActiveSourceTab('C')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSourceTab === 'C'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>3. AI Soạn Đề Tự Động</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB A: CÁCH 1 - TRÍCH XUẤT TỪ SÁCH GIÁO KHOA (PDF) & ẢNH/FILE  */}
        {/* ============================================================== */}
        {activeSourceTab === 'A' && (
          <div className="pt-5 space-y-6">
            {/* SUB-SECTION 1: KHO SGK ĐÃ TẢI LÊN */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Library className="w-4 h-4 text-blue-600" />
                    Kho Sách Giáo Khoa (PDF) Đã Tải Lên ({filteredSgkBooks.length} sách)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bấm "⚡ Trích xuất câu hỏi" để lấy nội dung làm đề kiểm tra ngay lập tức, hoặc bấm "📖 Đọc PDF"
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={sgkFilterSubject}
                    onChange={e => setSgkFilterSubject(e.target.value)}
                    className="text-[11px] p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">Tất cả môn ({ALL_CURRENT_SUBJECTS.length})</option>
                    {ALL_CURRENT_SUBJECTS.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>

                  <select
                    value={sgkFilterGrade}
                    onChange={e => setSgkFilterGrade(e.target.value)}
                    className="text-[11px] p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">Tất cả lớp</option>
                    {GRADE_LEVELS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsBatchUploadOpen(true)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tải thêm SGK</span>
                  </button>

                  {localTextbooks.length > 0 && (
                    <button
                      onClick={handleClearAllBooks}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer"
                      title="Xóa tất cả các file có sẵn trong kho SGK"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa kho</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SGK Grid Cards */}
              {localTextbooks.length === 0 ? (
                <div className="py-10 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">Kho Sách Giáo Khoa & Tài Liệu Đang Trống</h4>
                    <p className="text-slate-500 max-w-md mx-auto text-xs">
                      Tất cả file mẫu có sẵn đã được làm sạch. Bạn hãy bấm nút bên dưới để tải lên các file PDF SGK, file ảnh chụp đề thi hoặc file Excel từ máy tính của bạn.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBatchUploadOpen(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <FileUp className="w-4 h-4" />
                    <span>Tải nhiều file SGK (.PDF) lên kho ngay</span>
                  </button>
                </div>
              ) : filteredSgkBooks.length === 0 ? (
                <div className="py-8 text-center bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
                  Chưa có sách nào phù hợp bộ lọc.{' '}
                  <button
                    onClick={() => setIsBatchUploadOpen(true)}
                    className="text-blue-600 font-bold underline cursor-pointer"
                  >
                    Bấm vào đây để tải nhiều file SGK (.PDF) lên kho
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSgkBooks.map(book => {
                    const isSelected = selectedBookForExtraction?.id === book.id;
                    const effSub = book.subject === 'Môn khác' && book.customSubjectName
                      ? book.customSubjectName
                      : book.subject;

                    return (
                      <div
                        key={book.id}
                        className={`p-3 bg-white rounded-lg border transition-all flex flex-col justify-between space-y-2.5 ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {effSub} • Lớp {book.grade}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatFileSize(book.fileSize)}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1" title={book.title}>
                            {book.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {book.curriculum} • ~{book.pageCount || 120} trang
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setViewingBook(book)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Xem & Đọc file PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Xóa sách"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleSelectBookForExtraction(book)}
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{isSelected ? 'Đã chọn trích xuất' : 'Trích xuất làm đề'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SUB-SECTION 2: KHU VỰC TRÍCH XUẤT THÔNG MINH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    1. Nội dung văn bản / ghi chú yêu cầu trích xuất:
                  </label>
                  {selectedBookForExtraction && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Sách: {selectedBookForExtraction.title}
                    </span>
                  )}
                </div>
                <textarea
                  value={sourceAText}
                  onChange={e => setSourceAText(e.target.value)}
                  placeholder={`Dán nội dung bài tập, câu hỏi hoặc yêu cầu AI trích xuất từ sách...\nVí dụ:\nCâu 1: Cho hàm số y = ax^2 + bx + c (a ≠ 0). Tọa độ đỉnh I là:\nA. (-b/2a; -Δ/4a)\nB. (b/2a; Δ/4a)\nC. (-b/a; -c/a)\nD. (0; c)\nĐáp án: A`}
                  rows={6}
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    2. Hoặc tải trực tiếp file PDF SGK / Ảnh chụp bài tập:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsBatchUploadOpen(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileUp className="w-3 h-3" />
                    <span>Tải nhiều file SGK lên kho →</span>
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    multiple
                    onChange={handleFileUploadA}
                    className="hidden"
                    id="sourceA_fileInput"
                  />
                  <label
                    htmlFor="sourceA_fileInput"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Bấm để chọn nhiều file PDF SGK hoặc ảnh bài tập
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Hỗ trợ PDF SGK, JPG, PNG, WEBP (Nhận diện công thức Toán, Lý, Hóa & Bảng biểu)
                    </span>
                  </label>

                  {sourceAFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                      {sourceAFiles.map((f, i) => (
                        <div key={i} className="relative px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white flex items-center gap-1.5 text-xs text-slate-700">
                          <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="max-w-[120px] truncate">{f.name || `Tệp ${i + 1}`}</span>
                        </div>
                      ))}
                      <button
                        onClick={() => setSourceAFiles([])}
                        className="text-[11px] text-rose-500 self-center hover:underline ml-2 cursor-pointer font-bold"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleExtractA}
                disabled={isExtractingA || (!sourceAText && sourceAFiles.length === 0 && !selectedBookForExtraction)}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {isExtractingA ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI đang đọc SGK & trích xuất câu hỏi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AI Trích Xuất & Số Hóa Làm Đề Thi</span>
                  </>
                )}
              </button>
            </div>

            {/* Extracted Questions Preview */}
            {extractedQuestionsA.length > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">
                      Đã trích xuất thành công {extractedQuestionsA.length} câu hỏi từ SGK/Học liệu!
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      {extractedSnippetA}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSaveQuestionsAsExam(
                      extractedQuestionsA,
                      selectedBookForExtraction ? `Đề kiểm tra: ${selectedBookForExtraction.title}` : 'Đề kiểm tra trích xuất từ SGK',
                      selectedBookForExtraction ? selectedBookForExtraction.subject : 'Toán học',
                      selectedBookForExtraction?.grade || '10'
                    )}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Lưu vào Kho Đề Thi</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {extractedQuestionsA.map(q => (
                    <div key={q.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800 mb-1">
                        Câu {q.number}: <MathRenderer content={q.questionText} />
                      </div>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-1 text-slate-600">
                          {q.options.map((opt, i) => (
                            <span key={opt.id} className={opt.id === q.correctOptionId ? 'text-emerald-700 font-bold' : ''}>
                              {String.fromCharCode(65 + i)}. <MathRenderer content={opt.text} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB B: CÁCH 2 - NHẬP TỪ NGÂN HÀNG & FILE MẪU EXCEL / WORD       */}
        {/* ============================================================== */}
        {activeSourceTab === 'B' && (
          <div className="pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 gap-3">
              <div>
                <h4 className="text-xs font-bold text-blue-900">Mẫu Tệp Ngân Hàng Câu Hỏi (.xlsx)</h4>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  File mẫu chuẩn hỗ trợ 4 mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao), đáp án A-D và giải thích KaTeX.
                </p>
              </div>
              <button
                onClick={downloadSampleQuestionBankTemplate}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải tệp mẫu Excel</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
              <input
                ref={fileInputRefB}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUploadB}
                className="hidden"
                id="sourceB_fileInput"
              />
              <label
                htmlFor="sourceB_fileInput"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Nhấn để tải lên file Excel ngân hàng câu hỏi
                </span>
                <span className="text-[11px] text-slate-400">
                  Hỗ trợ định dạng .xlsx, .xls theo mẫu chuẩn EduNexa
                </span>
              </label>
            </div>

            {isImportingB && (
              <div className="flex items-center justify-center space-x-2 py-4 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Đang phân tích cấu trúc ngân hàng câu hỏi...</span>
              </div>
            )}

            {importedQuestionsB.length > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Đã đọc thành công {importedQuestionsB.length} câu hỏi từ tệp Excel!
                  </span>
                  <button
                    onClick={() => handleSaveQuestionsAsExam(
                      importedQuestionsB,
                      'Đề thi nhập từ Ngân hàng Excel',
                      'Toán học',
                      '10'
                    )}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Lưu thành Đề thi</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {importedQuestionsB.map(q => (
                    <div key={q.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800 mb-1">
                        Câu {q.number}: <MathRenderer content={q.questionText} />
                      </div>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-1 text-slate-600">
                          {q.options.map((opt, i) => (
                            <span key={opt.id} className={opt.id === q.correctOptionId ? 'text-emerald-700 font-bold' : ''}>
                              {String.fromCharCode(65 + i)}. <MathRenderer content={opt.text} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB C: CÁCH 3 - AI TỰ ĐỘNG SINH ĐỀ THEO CHƯƠNG MỤC SGK        */}
        {/* ============================================================== */}
        {activeSourceTab === 'C' && (
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Môn học ({ALL_CURRENT_SUBJECTS.length} môn)</label>
                <select
                  value={sourceCSubject}
                  onChange={e => setSourceCSubject(e.target.value)}
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
                  value={sourceCGrade}
                  onChange={e => setSourceCGrade(e.target.value)}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Số câu hỏi</label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={sourceCCount}
                  onChange={e => setSourceCCount(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
                />
              </div>
            </div>

            {sourceCSubject === 'Môn khác' && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                <label className="block text-xs font-bold text-purple-900">
                  ✨ Nhập tên Môn học khác tùy chọn:
                </label>
                <input
                  type="text"
                  required
                  value={customSourceCSubject}
                  onChange={e => setCustomSourceCSubject(e.target.value)}
                  placeholder="Ví dụ: Tiếng Pháp, Tiếng Trung, Kỹ năng sống, STEM & Robot..."
                  className="w-full text-xs p-2.5 border border-purple-300 rounded-lg bg-white focus:outline-hidden font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề / Bài học SGK trọng tâm</label>
              <input
                type="text"
                value={sourceCTopic}
                onChange={e => setSourceCTopic(e.target.value)}
                placeholder="Ví dụ: Hàm số bậc hai, dấu của tam thức bậc hai..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Yêu cầu sư phạm & bài toán thực tế</label>
              <input
                type="text"
                value={sourceCNotes}
                onChange={e => setSourceCNotes(e.target.value)}
                placeholder="Ví dụ: Tăng cường câu hỏi ứng dụng thực tế, bài toán tối ưu rào vườn..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 italic">
                * AI biên soạn đề thi bám sát chương trình Giáo dục Phổ thông 2018 với công thức KaTeX chuẩn mực
              </span>
              <button
                onClick={handleGenerateC}
                disabled={isGeneratingC}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {isGeneratingC ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI đang tạo câu hỏi chuẩn...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>AI Soạn Đề Thi Ngay</span>
                  </>
                )}
              </button>
            </div>

            {generatedQuestionsC.length > 0 && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">
                    AI đã tạo xong {generatedQuestionsC.length} câu hỏi chuẩn xác!
                  </span>
                  <button
                    onClick={() => handleSaveQuestionsAsExam(
                      generatedQuestionsC,
                      `Đề AI: ${sourceCTopic}`,
                      sourceCSubject,
                      sourceCGrade
                    )}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Lưu thành Đề thi</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {generatedQuestionsC.map(q => (
                    <div key={q.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800 mb-1">
                        Câu {q.number}: <MathRenderer content={q.questionText} />
                      </div>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-1 text-slate-600">
                          {q.options.map((opt, i) => (
                            <span key={opt.id} className={opt.id === q.correctOptionId ? 'text-emerald-700 font-bold' : ''}>
                              {String.fromCharCode(65 + i)}. <MathRenderer content={opt.text} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: KHO ĐỀ LƯU TRỮ TRỰC QUAN */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Kho Đề Thi Lưu Trữ ({exams.length} đề thi)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Được đồng bộ trực tiếp với Firestore – Tải đề, sửa đổi và giao bài cho học sinh
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigateToMatrix}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề từ Ma trận chuẩn</span>
            </button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề đề thi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
            />
          </div>

          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden text-slate-700"
          >
            <option value="all">Tất cả môn học ({ALL_CURRENT_SUBJECTS.length})</option>
            {ALL_CURRENT_SUBJECTS.map(s => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="approved">Đã duyệt</option>
            <option value="draft">Bản nháp</option>
          </select>
        </div>

        {/* Exam Cards List */}
        {filteredExams.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Không tìm thấy đề thi phù hợp với bộ lọc
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExams.map(exam => (
              <div
                key={exam.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-white hover:shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {exam.subject} {exam.grade ? `Lớp ${exam.grade}` : ''}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exam.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : exam.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {exam.status === 'published'
                        ? 'Đã xuất bản'
                        : exam.status === 'approved'
                        ? 'Đã duyệt'
                        : 'Bản nháp'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{exam.title}</h4>
                  <div className="flex items-center space-x-3 text-slate-500 text-xs mt-1">
                    <span>{exam.questions.length} câu hỏi</span>
                    <span>•</span>
                    <span>{exam.duration} phút</span>
                    <span>•</span>
                    <span>Thang {exam.totalScore} điểm</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setInspectingExam(exam)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Xem chi tiết các câu hỏi trong đề"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingExam(JSON.parse(JSON.stringify(exam)))}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa đề thi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCloneExam(exam)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Nhân bản đề"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingExamId(exam.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Xóa đề"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectExamForAssignment(exam)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Giao bài & Trộn đề</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next Step Banner */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              Bước 3
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs">
                Đã chuẩn bị xong nguồn học liệu & câu hỏi?
              </h4>
              <p className="text-[11px] text-slate-600">
                Chuyển sang Bước 3 để Thiết kế Ma trận 4 mức độ và Bản đặc tả chi tiết (YCCĐ) trước khi sinh đề.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToMatrix}
            className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <span>Thiết kế Ma trận & Bản đặc tả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: TẢI NHIỀU FILE SGK (.PDF) LÊN KHO                     */}
      {/* ============================================================== */}
      {isBatchUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tải Nhiều File Sách Giáo Khoa (PDF) Lên Kho
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ tải đồng thời nhiều file PDF SGK, Sách bài tập cho tất cả các môn học
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsBatchUploadOpen(false);
                  setBatchFiles([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {batchUploadSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{batchUploadSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Metadata row: Subject, Grade, Curriculum */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học ({ALL_CURRENT_SUBJECTS.length} môn)
                  </label>
                  <select
                    value={batchSubject}
                    onChange={e => setBatchSubject(e.target.value)}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <select
                    value={batchGrade}
                    onChange={e => setBatchGrade(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden font-medium"
                  >
                    {GRADE_LEVELS.map(g => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bộ sách
                  </label>
                  <select
                    value={batchCurriculum}
                    onChange={e => setBatchCurriculum(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden font-medium"
                  >
                    {CURRICULUM_SERIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Subject Name input if "Môn khác" is chosen */}
              {batchSubject === 'Môn khác' && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                  <label className="block text-xs font-bold text-purple-900">
                    ✨ Nhập tên môn học khác:
                  </label>
                  <input
                    type="text"
                    required
                    value={customBatchSubject}
                    onChange={e => setCustomBatchSubject(e.target.value)}
                    placeholder="Ví dụ: Tiếng Pháp, Tiếng Đức, Kỹ năng sống, STEM & Robotics..."
                    className="w-full text-xs p-2.5 border border-purple-300 rounded-lg bg-white focus:outline-hidden font-medium"
                  />
                </div>
              )}

              {/* Multi-File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn các file PDF sách giáo khoa (có thể chọn nhiều file cùng lúc):
                </label>
                <input
                  ref={multiFileInputRef}
                  type="file"
                  multiple
                  accept="application/pdf,.pdf"
                  onChange={handleSelectBatchFiles}
                  className="hidden"
                  id="batch_pdf_file_input"
                />
                <div
                  onClick={() => multiFileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50/80 rounded-xl p-6 text-center cursor-pointer transition-colors"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      Bấm để chọn nhiều file PDF SGK từ máy tính
                    </span>
                    <span className="text-xs text-slate-500">
                      Hỗ trợ tải đồng thời 1 đến nhiều file .pdf (Tập 1, Tập 2, Sách bài tập, Sách chuyên đề)
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Files List */}
              {batchFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Danh sách file đã chọn ({batchFiles.length} file):</span>
                    <button
                      type="button"
                      onClick={() => setBatchFiles([])}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {batchFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate" title={f.name}>
                            {f.name}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                            {(f.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeBatchFile(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                          title="Bỏ file này"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsBatchUploadOpen(false);
                  setBatchFiles([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={batchFiles.length === 0 || isUploadingBatch}
                onClick={handleSubmitBatchUpload}
                className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {isUploadingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu trữ {batchFiles.length} file...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tải lên {batchFiles.length} file SGK</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: XEM & ĐỌC FILE PDF SGK                               */}
      {/* ============================================================== */}
      {viewingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{viewingBook.title}</h3>
                  <p className="text-[11px] text-slate-500">
                    {viewingBook.subject} • Lớp {viewingBook.grade} • {viewingBook.curriculum} • {formatFileSize(viewingBook.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    handleSelectBookForExtraction(viewingBook);
                    setViewingBook(null);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trích xuất đề kiểm tra</span>
                </button>

                <button
                  onClick={() => setViewingBook(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex flex-col items-center justify-center">
              {viewingBook.fileUrl ? (
                <iframe
                  src={viewingBook.fileUrl}
                  title={viewingBook.title}
                  className="w-full h-full rounded-lg border border-slate-300 bg-white shadow-sm"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl border border-slate-200 max-w-md shadow-sm space-y-3">
                  <BookOpen className="w-12 h-12 text-blue-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">Bản xem trước sách giáo khoa</h4>
                  <p className="text-xs text-slate-500">
                    Sách "{viewingBook.title}" đã được lưu trong cơ sở dữ liệu. Bấm "Trích xuất đề kiểm tra" để AI phân tích câu hỏi và bài tập trong sách này.
                  </p>
                  <button
                    onClick={() => {
                      handleSelectBookForExtraction(viewingBook);
                      setViewingBook(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    Trích xuất bài tập làm đề ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN XÓA ĐỀ THI */}
      {deletingExamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-slate-800">Xác nhận xóa đề thi</h4>
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn xóa đề thi này khỏi Kho đề? Thao tác này sẽ xóa vĩnh viễn khỏi Firestore và không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingExamId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  await onDeleteExam(deletingExamId);
                  setDeletingExamId(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: XEM CHI TIẾT CÁC CÂU HỎI TRONG ĐỀ */}
      {inspectingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-800 line-clamp-1">
                    {inspectingExam.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {inspectingExam.subject} {inspectingExam.grade ? `Lớp ${inspectingExam.grade}` : ''}
                    </span>
                    <span>•</span>
                    <span>{inspectingExam.questions.length} câu hỏi</span>
                    <span>•</span>
                    <span>{inspectingExam.duration} phút</span>
                    <span>•</span>
                    <span>Thang {inspectingExam.totalScore} điểm</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectingExam(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {inspectingExam.questions.map((q, idx) => (
                <div key={q.id || idx} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-blue-600">Câu {q.number || idx + 1}:</span>
                      {q.topic && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                          {q.topic}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">({q.points || 0.25} điểm)</span>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'true_false' ? 'Đúng/Sai' : 'Tự luận'}
                    </span>
                  </div>

                  <div className="text-slate-800 font-medium leading-relaxed">
                    <MathRenderer content={q.questionText} />
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = opt.id === q.correctOptionId;
                        return (
                          <div
                            key={opt.id || oIdx}
                            className={`p-2 rounded-lg border text-xs flex items-center space-x-2 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700'
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
                              <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 py-0.2 rounded font-bold">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                      <strong className="text-slate-700">Lời giải chi tiết: </strong>
                      <MathRenderer content={q.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  handleCloneExam(inspectingExam);
                  setInspectingExam(null);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nhân bản đề</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setInspectingExam(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    const target = inspectingExam;
                    setInspectingExam(null);
                    onSelectExamForAssignment(target);
                  }}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>Giao bài & Trộn đề ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CHỈNH SỬA ĐỀ THI */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center space-x-2.5">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Chỉnh Sửa Đề Thi: {editingExam.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật tiêu đề, thông số và các câu hỏi trong đề
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingExam(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exam Meta Form */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề đề thi:</label>
                  <input
                    type="text"
                    value={editingExam.title}
                    onChange={e => setEditingExam({ ...editingExam, title: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái:</label>
                  <select
                    value={editingExam.status}
                    onChange={e => setEditingExam({ ...editingExam, status: e.target.value as any, isApproved: e.target.value !== 'draft' })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="published">Đã xuất bản</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Môn học:</label>
                  <select
                    value={editingExam.subject}
                    onChange={e => setEditingExam({ ...editingExam, subject: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    {ALL_CURRENT_SUBJECTS.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp:</label>
                  <select
                    value={editingExam.grade || '10'}
                    onChange={e => setEditingExam({ ...editingExam, grade: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    {GRADE_LEVELS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian (phút):</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={editingExam.duration}
                    onChange={e => setEditingExam({ ...editingExam, duration: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thang điểm:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingExam.totalScore}
                    onChange={e => setEditingExam({ ...editingExam, totalScore: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-bold text-blue-700"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Danh sách câu hỏi ({editingExam.questions.length} câu):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newQ: Question = {
                        id: `q_${Date.now()}`,
                        number: editingExam.questions.length + 1,
                        topic: 'Chủ đề mới',
                        level: 'recognition',
                        type: 'multiple_choice',
                        questionText: 'Nội dung câu hỏi mới...',
                        points: 0.5,
                        options: [
                          { id: 'opt_A', text: 'Phương án A' },
                          { id: 'opt_B', text: 'Phương án B' },
                          { id: 'opt_C', text: 'Phương án C' },
                          { id: 'opt_D', text: 'Phương án D' },
                        ],
                        correctOptionId: 'opt_A'
                      };
                      setEditingExam({
                        ...editingExam,
                        questions: [...editingExam.questions, newQ]
                      });
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu hỏi</span>
                  </button>
                </div>

                {editingExam.questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-blue-700">Câu {idx + 1}:</span>
                        <input
                          type="text"
                          value={q.topic || ''}
                          placeholder="Chủ đề..."
                          onChange={e => {
                            const updated = [...editingExam.questions];
                            updated[idx] = { ...q, topic: e.target.value };
                            setEditingExam({ ...editingExam, questions: updated });
                          }}
                          className="text-[11px] p-1 border border-slate-200 rounded bg-white w-40"
                        />
                        <select
                          value={q.type}
                          onChange={e => {
                            const updated = [...editingExam.questions];
                            updated[idx] = { ...q, type: e.target.value as any };
                            setEditingExam({ ...editingExam, questions: updated });
                          }}
                          className="text-[11px] p-1 border border-slate-200 rounded bg-white"
                        >
                          <option value="multiple_choice">Trắc nghiệm</option>
                          <option value="essay">Tự luận</option>
                          <option value="true_false">Đúng / Sai</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-slate-500">Điểm:</span>
                          <input
                            type="number"
                            step={0.1}
                            value={q.points || 0.5}
                            onChange={e => {
                              const updated = [...editingExam.questions];
                              updated[idx] = { ...q, points: Number(e.target.value) };
                              setEditingExam({ ...editingExam, questions: updated });
                            }}
                            className="w-12 text-center text-xs p-1 border border-slate-200 rounded bg-white font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingExam.questions.filter((_, i) => i !== idx).map((item, newI) => ({
                              ...item,
                              number: newI + 1
                            }));
                            setEditingExam({ ...editingExam, questions: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Xóa câu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={e => {
                        const updated = [...editingExam.questions];
                        updated[idx] = { ...q, questionText: e.target.value };
                        setEditingExam({ ...editingExam, questions: updated });
                      }}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                    />

                    {/* Options for MC */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div key={opt.id || oIdx} className="flex items-center space-x-1.5 bg-white p-1.5 rounded-lg border border-slate-200">
                            <span className="w-5 text-center font-bold text-slate-700 text-xs">
                              {String.fromCharCode(65 + oIdx)}:
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={e => {
                                const newOpts = [...(q.options || [])];
                                newOpts[oIdx] = { ...opt, text: e.target.value };
                                const updated = [...editingExam.questions];
                                updated[idx] = { ...q, options: newOpts };
                                setEditingExam({ ...editingExam, questions: updated });
                              }}
                              className="flex-1 text-xs p-1 border-none bg-transparent focus:outline-hidden"
                            />
                            <input
                              type="radio"
                              name={`correct_${q.id || idx}`}
                              checked={q.correctOptionId === opt.id}
                              onChange={() => {
                                const updated = [...editingExam.questions];
                                updated[idx] = { ...q, correctOptionId: opt.id };
                                setEditingExam({ ...editingExam, questions: updated });
                              }}
                              className="accent-emerald-600 cursor-pointer"
                              title="Chọn làm đáp án đúng"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingExam(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  const finalUpdated: Exam = {
                    ...editingExam,
                    updatedAt: new Date().toISOString()
                  };
                  await onSaveExam(finalUpdated);
                  setEditingExam(null);
                  alert(`Đã lưu thành công các thay đổi cho đề thi "${finalUpdated.title}"!`);
                }}
                className="flex items-center space-x-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Thay Đổi Đề Thi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
