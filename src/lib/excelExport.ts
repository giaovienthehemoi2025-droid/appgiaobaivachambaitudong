import * as XLSX from 'xlsx';
import { Submission, Question, ExamVariant, CognitiveLevel, QuestionType } from '../types';

/**
 * Download sample Question Bank Excel template
 */
export function downloadSampleQuestionBankTemplate(): void {
  const headers = [
    'Mã câu',
    'Môn',
    'Lớp',
    'Chủ đề',
    'Mức độ',
    'Loại câu',
    'Nội dung',
    'A',
    'B',
    'C',
    'D',
    'Đáp án',
    'Điểm',
    'Lời giải'
  ];

  const sampleRows = [
    [
      'TOAN10_001',
      'Toán',
      '10',
      'Hàm số bậc hai',
      'Nhận biết',
      'Trắc nghiệm',
      'Đỉnh của parabol $y = ax^2 + bx + c$ ($a \\ne 0$) có tọa độ là:',
      'I(-b/2a; -\\Delta/4a)',
      'I(b/2a; \\Delta/4a)',
      'I(-b/a; -\\Delta/2a)',
      'I(b/a; \\Delta/a)',
      'A',
      0.5,
      'Theo định lý về đồ thị hàm số bậc hai, tọa độ đỉnh parabol là $I(-\\frac{b}{2a}; -\\frac{\\Delta}{4a})$.'
    ],
    [
      'TOAN10_002',
      'Toán',
      '10',
      'Hàm số bậc hai',
      'Thông hiểu',
      'Trắc nghiệm',
      'Trục đối xứng của parabol $y = 2x^2 - 4x + 1$ là đường thẳng:',
      'x = 1',
      'x = -1',
      'x = 2',
      'x = -2',
      'A',
      0.5,
      'Trục đối xứng là $x = -\\frac{b}{2a} = -\\frac{-4}{2 \\times 2} = 1$.'
    ],
    [
      'TOAN10_003',
      'Toán',
      '10',
      'Bất phương trình bậc hai',
      'Vận dụng',
      'Trắc nghiệm',
      'Tập nghiệm của bất phương trình $x^2 - 5x + 6 \\le 0$ là:',
      '[2; 3]',
      '(-\\infty; 2] \\cup [3; +\\infty)',
      '(2; 3)',
      '\\emptyset',
      'A',
      0.5,
      'Tam thức $x^2 - 5x + 6 = 0$ có 2 nghiệm $x_1 = 2, x_2 = 3$. Trong khoảng hai nghiệm thì trái dấu với $a = 1 > 0$, do đó $x \\in [2; 3]$.'
    ],
    [
      'TOAN10_004',
      'Toán',
      '10',
      'Vectơ trong mặt phẳng',
      'Vận dụng cao',
      'Tự luận',
      'Cho tam giác ABC có $A(1; 2)$, $B(-2; 6)$, $C(9; 8)$. Tìm tọa độ trọng tâm G của tam giác ABC và tính diện tích tam giác.',
      '',
      '',
      '',
      '',
      'G(8/3; 16/3), S = 25',
      2.0,
      'Tọa độ trọng tâm: $x_G = \\frac{1 + (-2) + 9}{3} = \\frac{8}{3}$; $y_G = \\frac{2 + 6 + 8}{3} = \\frac{16}{3}$. Diện tích tính theo công thức tọa độ $S = 25$.'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // Mã câu
    { wch: 10 }, // Môn
    { wch: 8 },  // Lớp
    { wch: 22 }, // Chủ đề
    { wch: 14 }, // Mức độ
    { wch: 14 }, // Loại câu
    { wch: 45 }, // Nội dung
    { wch: 20 }, // A
    { wch: 20 }, // B
    { wch: 20 }, // C
    { wch: 20 }, // D
    { wch: 10 }, // Đáp án
    { wch: 8 },  // Điểm
    { wch: 40 }  // Lời giải
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MAU_NGAN_HANG_CAU_HOI');
  XLSX.writeFile(wb, 'Mau_Ngan_Hang_Cau_Hoi_EDUNEXA.xlsx');
}

/**
 * Parse uploaded Excel file into Question objects
 */
export async function parseQuestionBankExcel(file: File): Promise<Question[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  if (rows.length < 2) return [];

  // Skip header row
  const dataRows = rows.slice(1);
  const questions: Question[] = [];

  dataRows.forEach((row, idx) => {
    if (!row || row.length === 0 || !row[6]) return; // empty row or no question content

    const topic = (row[3] || 'Chung').toString().trim();
    const rawLevel = (row[4] || '').toString().toLowerCase();
    let level: CognitiveLevel = 'recognition';
    if (rawLevel.includes('thông') || rawLevel.includes('hieu')) level = 'comprehension';
    else if (rawLevel.includes('cao')) level = 'highApplication';
    else if (rawLevel.includes('vận') || rawLevel.includes('van')) level = 'application';

    const rawType = (row[5] || '').toString().toLowerCase();
    let type: QuestionType = 'multiple_choice';
    if (rawType.includes('tự luận') || rawType.includes('tu luan')) type = 'essay';
    else if (rawType.includes('đúng') || rawType.includes('dung/sai')) type = 'true_false';
    else if (rawType.includes('điền') || rawType.includes('dien')) type = 'fill_blank';

    const content = row[6].toString().trim();
    const rawAns = (row[11] || '').toString().trim();
    const points = Number(row[12]) || (type === 'essay' ? 2.0 : 0.5);
    const explanation = (row[13] || '').toString().trim();

    let options = undefined;
    let correctOptionId = rawAns;

    if (type === 'multiple_choice') {
      const optA = (row[7] || '').toString().trim();
      const optB = (row[8] || '').toString().trim();
      const optC = (row[9] || '').toString().trim();
      const optD = (row[10] || '').toString().trim();

      options = [
        { id: 'opt_A', text: optA || 'Phương án A' },
        { id: 'opt_B', text: optB || 'Phương án B' },
        { id: 'opt_C', text: optC || 'Phương án C' },
        { id: 'opt_D', text: optD || 'Phương án D' },
      ];

      const cleanAns = rawAns.toUpperCase();
      if (cleanAns.includes('A')) correctOptionId = 'opt_A';
      else if (cleanAns.includes('B')) correctOptionId = 'opt_B';
      else if (cleanAns.includes('C')) correctOptionId = 'opt_C';
      else if (cleanAns.includes('D')) correctOptionId = 'opt_D';
      else correctOptionId = 'opt_A';
    }

    questions.push({
      id: `q_imported_${Date.now()}_${idx}`,
      number: idx + 1,
      topic,
      level,
      type,
      questionText: content,
      options,
      correctOptionId,
      explanation,
      points,
      sourceType: 'bank'
    });
  });

  return questions;
}

/**
 * Export real submission results to XLSX
 */
export function exportSubmissionsToExcel(
  assignmentTitle: string,
  submissions: Submission[],
  questions: Question[] = []
): void {
  // Sheet 1: Bang diem tong hop
  const summaryHeaders = [
    'Mã biên nhận',
    'Họ và tên học sinh',
    'Lớp',
    'Ngày sinh',
    'Mã đề',
    'Điểm trắc nghiệm',
    'Điểm tự luận',
    'Tổng điểm',
    'Trạng thái',
    'Thời gian nộp bài',
    'Người chấm / Duyệt'
  ];

  const summaryRows = submissions.map(sub => [
    sub.receiptCode,
    sub.studentName,
    sub.className,
    sub.studentDob,
    sub.variantCode || 'Chính thức',
    sub.multipleChoiceScore,
    sub.status === 'needs_teacher_grading' ? 'Chờ chấm' : sub.essayScore,
    sub.status === 'needs_teacher_grading' ? `${sub.multipleChoiceScore} (Tạm tính)` : sub.totalScore,
    sub.status === 'graded' ? 'Đã chấm xong' : sub.status === 'needs_teacher_grading' ? 'Chờ chấm tự luận' : 'Đã nộp',
    new Date(sub.submittedAt).toLocaleString('vi-VN'),
    sub.gradedBy || 'Tự động'
  ]);

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  wsSummary['!cols'] = [
    { wch: 18 }, // Mã biên nhận
    { wch: 24 }, // Họ tên
    { wch: 10 }, // Lớp
    { wch: 14 }, // Ngày sinh
    { wch: 10 }, // Mã đề
    { wch: 16 }, // Điểm TN
    { wch: 14 }, // Điểm TL
    { wch: 14 }, // Tổng điểm
    { wch: 18 }, // Trạng thái
    { wch: 22 }, // Thời gian nộp
    { wch: 18 }  // Người chấm
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'BANG_DIEM_TONG_HOP');

  // Sheet 2: Chi tiet tra loi tung cau
  const detailHeaders = [
    'Mã biên nhận',
    'Học sinh',
    'Lớp',
    'Câu hỏi số',
    'Nội dung câu',
    'Loại câu',
    'Câu trả lời của HS',
    'Đáp án đúng / Hướng dẫn'
  ];

  const detailRows: any[][] = [];
  submissions.forEach(sub => {
    questions.forEach(q => {
      const studentAns = sub.answers[q.id] || '(Chưa làm)';
      let ansLabel = studentAns;
      if (q.options) {
        const found = q.options.find(o => o.id === studentAns);
        if (found) ansLabel = `${studentAns.replace('opt_', '')}: ${found.text}`;
      }
      let correctLabel = q.correctOptionId || q.explanation || '';
      if (q.options) {
        const found = q.options.find(o => o.id === q.correctOptionId);
        if (found) correctLabel = `${(q.correctOptionId || '').replace('opt_', '')}: ${found.text}`;
      }

      detailRows.push([
        sub.receiptCode,
        sub.studentName,
        sub.className,
        `Câu ${q.number}`,
        q.questionText.slice(0, 80),
        q.type,
        ansLabel,
        correctLabel
      ]);
    });
  });

  if (detailRows.length > 0) {
    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    wsDetail['!cols'] = [
      { wch: 16 },
      { wch: 20 },
      { wch: 10 },
      { wch: 12 },
      { wch: 40 },
      { wch: 16 },
      { wch: 30 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'CHI_TIET_BAI_LAM');
  }

  const safeTitle = assignmentTitle.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_');
  XLSX.writeFile(wb, `EDUNEXA_KetQua_${safeTitle}_${Date.now()}.xlsx`);
}

/**
 * Export list of 10 variant links to Excel
 */
export function exportVariantLinksToExcel(
  assignmentTitle: string,
  variants: ExamVariant[],
  baseUrl: string,
  assignmentId: string
): void {
  const headers = ['STT', 'Mã đề', 'Số câu hỏi', 'Link làm bài học sinh (Mở không cần Gmail)'];
  const rows = variants.map((v, i) => [
    i + 1,
    `Mã đề ${v.variantCode}`,
    v.questions.length,
    `${baseUrl}?assignmentId=${assignmentId}&variantId=${v.variantId}`
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 70 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DANH_SACH_10_MA_DE');
  XLSX.writeFile(wb, `EDUNEXA_10_MaDe_${assignmentTitle.replace(/\s+/g, '_')}.xlsx`);
}
