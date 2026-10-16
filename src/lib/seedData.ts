import { ClassInfo, Matrix, Exam, Assignment, Submission, TeacherSetting, TextbookPdf } from '../types';
import { generate10Variants } from './shuffler';

export const DEFAULT_TEACHER_SETTING: TeacherSetting = {
  id: 'setting_default',
  teacherId: 'teacher_default_edunexa',
  teacherName: 'Thầy Nguyễn Văn An',
  schoolName: 'THPT Chuyên Chu Văn An',
  sheetsSpreadsheetId: '',
  autoSyncSheets: false,
  updatedAt: new Date().toISOString()
};

export const INITIAL_CLASSES: ClassInfo[] = [
  {
    id: 'class_10A1',
    teacherId: 'teacher_default_edunexa',
    name: '10A1',
    grade: '10',
    subject: 'Toán học',
    studentCount: 35,
    studentRoster: [
      { id: 'hs_1', name: 'Nguyễn Minh Quân', dob: '15/04/2008' },
      { id: 'hs_2', name: 'Trần Thị Mai Phương', dob: '22/09/2008' },
      { id: 'hs_3', name: 'Lê Hoàng Long', dob: '08/01/2008' },
      { id: 'hs_4', name: 'Phạm Thu Trang', dob: '30/11/2008' },
      { id: 'hs_5', name: 'Vũ Đức Nam', dob: '12/06/2008' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'class_10A2',
    teacherId: 'teacher_default_edunexa',
    name: '10A2',
    grade: '10',
    subject: 'Toán học',
    studentCount: 38,
    studentRoster: [
      { id: 'hs_6', name: 'Hoàng Quốc Bảo', dob: '05/03/2008' },
      { id: 'hs_7', name: 'Đặng Ngọc Ánh', dob: '19/08/2008' }
    ],
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_MATRIX: Matrix = {
  id: 'matrix_demo_01',
  teacherId: 'teacher_default_edunexa',
  title: 'Ma trận Đề kiểm tra 1 tiết - Chương III: Hàm số bậc hai & Dấu tam thức',
  subject: 'Toán học',
  grade: '10',
  curriculum: 'Kết nối tri thức với cuộc sống',
  examType: 'Kiểm tra 1 tiết (45 phút)',
  duration: 45,
  totalScore: 10,
  totalQuestions: 14,
  multipleChoiceRatio: 70,
  essayRatio: 30,
  isApproved: true,
  topics: [
    {
      id: 'tp_1',
      topicName: 'Hàm số và đồ thị hàm số bậc hai',
      recognition: 3,
      comprehension: 2,
      application: 1,
      highApplication: 0,
      pointsPerQuestion: 0.5,
      questionType: 'multiple_choice'
    },
    {
      id: 'tp_2',
      topicName: 'Dấu của tam thức bậc hai & Bất phương trình',
      recognition: 2,
      comprehension: 2,
      application: 2,
      highApplication: 0,
      pointsPerQuestion: 0.5,
      questionType: 'multiple_choice'
    },
    {
      id: 'tp_3',
      topicName: 'Ứng dụng thực tế và bài toán chứa tham số m',
      recognition: 0,
      comprehension: 0,
      application: 1,
      highApplication: 1,
      pointsPerQuestion: 1.5,
      questionType: 'essay'
    }
  ],
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
};

export const INITIAL_EXAM: Exam = {
  id: 'exam_demo_01',
  teacherId: 'teacher_default_edunexa',
  matrixId: 'matrix_demo_01',
  title: 'Đề kiểm tra 45 phút - Hàm số và Tam thức bậc hai (Chính thức)',
  subject: 'Toán học',
  grade: '10',
  duration: 45,
  totalScore: 10,
  isApproved: true,
  status: 'published',
  questions: [
    {
      id: 'q1',
      number: 1,
      topic: 'Hàm số và đồ thị hàm số bậc hai',
      level: 'recognition',
      type: 'multiple_choice',
      questionText: 'Tọa độ đỉnh $I$ của parabol $(P): y = x^2 - 4x + 3$ là:',
      options: [
        { id: 'opt_A', text: '$I(2; -1)$' },
        { id: 'opt_B', text: '$I(-2; 15)$' },
        { id: 'opt_C', text: '$I(1; 0)$' },
        { id: 'opt_D', text: '$I(4; 3)$' }
      ],
      correctOptionId: 'opt_A',
      explanation: 'Hoành độ đỉnh $x_I = -\\frac{b}{2a} = -\\frac{-4}{2} = 2$. Tung độ đỉnh $y_I = 2^2 - 4(2) + 3 = -1$. Vậy $I(2; -1)$.',
      points: 0.5,
      sourceType: 'sgk'
    },
    {
      id: 'q2',
      number: 2,
      topic: 'Hàm số và đồ thị hàm số bậc hai',
      level: 'recognition',
      type: 'multiple_choice',
      questionText: 'Trục đối xứng của đồ thị hàm số $y = -2x^2 + 8x - 1$ là đường thẳng có phương trình:',
      options: [
        { id: 'opt_A', text: '$x = 2$' },
        { id: 'opt_B', text: '$x = -2$' },
        { id: 'opt_C', text: '$x = 4$' },
        { id: 'opt_D', text: '$y = 2$' }
      ],
      correctOptionId: 'opt_A',
      explanation: 'Trục đối xứng là đường thẳng $x = -\\frac{b}{2a} = -\\frac{8}{2 \\times (-2)} = 2$.',
      points: 0.5,
      sourceType: 'bank'
    },
    {
      id: 'q3',
      number: 3,
      topic: 'Hàm số và đồ thị hàm số bậc hai',
      level: 'comprehension',
      type: 'multiple_choice',
      questionText: 'Cho parabol $(P): y = ax^2 + bx + 2$ đi qua hai điểm $A(1; 5)$ và $B(-1; 1)$. Giá trị của $a + b$ bằng:',
      options: [
        { id: 'opt_A', text: '$3$' },
        { id: 'opt_B', text: '$1$' },
        { id: 'opt_C', text: '$-1$' },
        { id: 'opt_D', text: '$5$' }
      ],
      correctOptionId: 'opt_A',
      explanation: 'Thay tọa độ: $\\begin{cases} a + b + 2 = 5 \\\\ a - b + 2 = 1 \\end{cases} \\Rightarrow \\begin{cases} a + b = 3 \\\\ a - b = -1 \\end{cases} \\Rightarrow a = 1, b = 2$. Vậy $a + b = 3$.',
      points: 0.5,
      sourceType: 'ai'
    },
    {
      id: 'q4',
      number: 4,
      topic: 'Dấu của tam thức bậc hai & Bất phương trình',
      level: 'recognition',
      type: 'multiple_choice',
      questionText: 'Tam thức bậc hai $f(x) = x^2 - 6x + 9$ nhận giá trị dương khi và chỉ khi:',
      options: [
        { id: 'opt_A', text: '$x \\ne 3$' },
        { id: 'opt_B', text: '$x > 3$' },
        { id: 'opt_C', text: '$x < 3$' },
        { id: 'opt_D', text: '$x \\in \\mathbb{R}$' }
      ],
      correctOptionId: 'opt_A',
      explanation: 'Ta có $f(x) = (x - 3)^2 \\ge 0, \\forall x$. Do đó $f(x) > 0 \\Leftrightarrow x \\ne 3$.',
      points: 0.5,
      sourceType: 'sgk'
    },
    {
      id: 'q5',
      number: 5,
      topic: 'Dấu của tam thức bậc hai & Bất phương trình',
      level: 'comprehension',
      type: 'multiple_choice',
      questionText: 'Tập nghiệm của bất phương trình bậc hai $2x^2 - 5x + 2 \\le 0$ là đoạn $[a; b]$. Khi đó $2a + b$ bằng:',
      options: [
        { id: 'opt_A', text: '$3$' },
        { id: 'opt_B', text: '$4$' },
        { id: 'opt_C', text: '$\\frac{5}{2}$' },
        { id: 'opt_D', text: '$2$' }
      ],
      correctOptionId: 'opt_A',
      explanation: 'Phương trình $2x^2 - 5x + 2 = 0$ có 2 nghiệm $x_1 = \\frac{1}{2}, x_2 = 2$. Vì $a = 2 > 0$ nên $f(x) \\le 0 \\Leftrightarrow x \\in [\\frac{1}{2}; 2]$. Vậy $a = \\frac{1}{2}, b = 2 \\Rightarrow 2a + b = 2(\\frac{1}{2}) + 2 = 3$.',
      points: 0.5,
      sourceType: 'bank'
    },
    {
      id: 'q6',
      number: 6,
      topic: 'Dấu của tam thức bậc hai & Bất phương trình',
      level: 'application',
      type: 'multiple_choice',
      questionText: 'Tìm tất cả các giá trị thực của tham số $m$ để bất phương trình $x^2 - 2(m-1)x + 4 > 0$ nghiệm đúng với mọi $x \\in \\mathbb{R}$.',
      options: [
        { id: 'opt_A', text: '$-1 < m < 3$' },
        { id: 'opt_B', text: '$m < -1$ hoặc $m > 3$' },
        { id: 'opt_C', text: '$-3 < m < 1$' },
        { id: 'opt_D', text: '$-1 \\le m \\le 3$' }
      ],
      correctOptionId: 'opt_A',
      explanation: 'Hệ số $a = 1 > 0$. Bất phương trình $> 0, \\forall x \\Leftrightarrow \\Delta\' < 0 \\Leftrightarrow (m-1)^2 - 4 < 0 \\Leftrightarrow m^2 - 2m - 3 < 0 \\Leftrightarrow -1 < m < 3$.',
      points: 0.5,
      sourceType: 'ai'
    },
    {
      id: 'q7',
      number: 7,
      topic: 'Ứng dụng thực tế và bài toán chứa tham số m',
      level: 'application',
      type: 'essay',
      questionText: '(Tự luận - 2.0 điểm) Một người nông dân dùng $60\\text{ m}$ lưới rào để rào một mảnh vườn hình chữ nhật sát một bờ tường thẳng (không cần rào phía bờ tường). Hãy xác định kích thước mảnh vườn để diện tích rào được là lớn nhất và tính diện tích lớn nhất đó.',
      correctOptionId: 'Rộng 15m, Dài 30m, S_max = 450m2',
      explanation: 'Gọi chiều rộng mảnh vườn là $x$ ($0 < x < 30$, mét). Chiều dài vườn là $60 - 2x$. Diện tích $S(x) = x(60 - 2x) = -2x^2 + 60x$. Đây là tam thức bậc hai có $a = -2 < 0$, đạt giá trị lớn nhất tại đỉnh $x = -\\frac{60}{2(-2)} = 15\\text{ m}$. Chiều dài tương ứng là $60 - 2(15) = 30\\text{ m}$. Diện tích cực đại $S_{\\max} = 15 \\times 30 = 450\\text{ m}^2$.',
      points: 2.0,
      sourceType: 'sgk'
    },
    {
      id: 'q8',
      number: 8,
      topic: 'Ứng dụng thực tế và bài toán chứa tham số m',
      level: 'highApplication',
      type: 'essay',
      questionText: '(Tự luận - 1.0 điểm) Cho phương trình bậc hai: $x^2 - 2(m + 1)x + m^2 + 2m = 0$. Tìm $m$ để phương trình có hai nghiệm phân biệt $x_1, x_2$ thỏa mãn hệ thức: $x_1^2 + x_2^2 - 3x_1 x_2 = 5$.',
      correctOptionId: 'm = 1 hoặc m = -3',
      explanation: 'Điều kiện 2 nghiệm phân biệt: $\\Delta\' = (m+1)^2 - (m^2+2m) = 1 > 0$ (luôn đúng với mọi $m$). Theo định lý Viète: $x_1 + x_2 = 2(m+1)$, $x_1 x_2 = m^2 + 2m$. Biến đổi hệ thức: $(x_1 + x_2)^2 - 5x_1 x_2 = 5 \\Leftrightarrow 4(m+1)^2 - 5(m^2+2m) = 5 \\Leftrightarrow -m^2 - 2m - 1 = 0 \\Leftrightarrow -(m+1)^2 = 0 \\Rightarrow m = -1$. (Hoặc kết quả tương đương).',
      points: 1.0,
      sourceType: 'ai'
    }
  ],
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 86400000).toISOString()
};

export const INITIAL_VARIANTS = generate10Variants(INITIAL_EXAM);

export const INITIAL_ASSIGNMENT: Assignment = {
  id: 'asg_demo_01',
  teacherId: 'teacher_default_edunexa',
  examId: 'exam_demo_01',
  title: 'Kiểm tra 45 phút - Đại số 10 (Lớp 10A1 & 10A2)',
  subject: 'Toán học',
  grade: '10',
  durationMinutes: 45,
  classIds: ['class_10A1', 'class_10A2'],
  allowManualClass: true,
  openAt: new Date(Date.now() - 86400000).toISOString(),
  closeAt: new Date(Date.now() + 86400000 * 3).toISOString(),
  maxAttempts: 1,
  showScoreMode: 'immediate',
  status: 'active',
  isVariantSet: true,
  variants: INITIAL_VARIANTS,
  createdAt: new Date(Date.now() - 86400000).toISOString()
};

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_demo_01',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v101`,
    variantCode: '101',
    studentName: 'Nguyễn Minh Quân',
    studentDob: '15/04/2008',
    className: '10A1',
    startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 4.3).toISOString(),
    status: 'graded',
    answers: {
      'q1': 'opt_A',
      'q2': 'opt_A',
      'q3': 'opt_A',
      'q4': 'opt_A',
      'q5': 'opt_A',
      'q6': 'opt_A',
      'q7': 'Gọi chiều rộng là x, chiều dài là 60 - 2x. Diện tích S(x) = -2x^2 + 60x. Đạt cực đại khi x = 15m. Chiều dài 30m, diện tích lớn nhất là 450 m2.',
      'q8': 'Ta có Delta\' = 1 > 0. Áp dụng Viete tính được m = -1 thỏa mãn điều kiện đề bài.'
    },
    multipleChoiceScore: 3.0,
    essayScore: 3.0,
    totalScore: 10.0,
    teacherFeedback: 'Bài làm xuất sắc, lập luận chặt chẽ và chữ viết rõ ràng.',
    receiptCode: 'EDX-SUB-8F92A',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_02',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v102`,
    variantCode: '102',
    studentName: 'Trần Thị Mai Phương',
    studentDob: '22/09/2008',
    className: '10A1',
    startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 3.4).toISOString(),
    status: 'graded',
    answers: {
      'q1': 'opt_A',
      'q2': 'opt_A',
      'q3': 'opt_A',
      'q4': 'opt_A',
      'q5': 'opt_B', // sai 1 cau
      'q6': 'opt_A',
      'q7': 'Chiều rộng 15m, chiều dài 30m. Diện tích cực đại 450m2.',
      'q8': 'Học sinh tìm được Delta\' = 1, tính được m = -1.'
    },
    multipleChoiceScore: 2.5,
    essayScore: 2.8,
    totalScore: 8.8,
    teacherFeedback: 'Làm tốt, chú ý kiểm tra lại bảng xét dấu ở câu bất phương trình.',
    receiptCode: 'EDX-SUB-3D41E',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_03',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v103`,
    variantCode: '103',
    studentName: 'Lê Hoàng Long',
    studentDob: '08/01/2008',
    className: '10A1',
    startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    status: 'needs_teacher_grading', // Chờ chấm tự luận
    answers: {
      'q1': 'opt_A',
      'q2': 'opt_A',
      'q3': 'opt_C',
      'q4': 'opt_A',
      'q5': 'opt_A',
      'q6': 'opt_B',
      'q7': 'Kích thước là chiều rộng 15m và chiều dài 30m, diện tích 450m2.',
      'q8': 'Phương trình có Delta\' = 1. Em tính ra m = -1.'
    },
    multipleChoiceScore: 2.0,
    essayScore: 0,
    totalScore: 2.0, // Tạm tính chờ chấm
    receiptCode: 'EDX-SUB-9C17K',
    isVerifiedStudent: true,
    syncedToSheets: false
  },
  {
    id: 'sub_demo_04',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v104`,
    variantCode: '104',
    studentName: 'Hoàng Quốc Bảo',
    studentDob: '05/03/2008',
    className: '10A2',
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 1.4).toISOString(),
    status: 'graded',
    answers: {
      'q1': 'opt_A',
      'q2': 'opt_A',
      'q3': 'opt_A',
      'q4': 'opt_A',
      'q5': 'opt_A',
      'q6': 'opt_A',
      'q7': 'Chiều rộng vườn 15m, chiều dài 30m. Diện tích cực đại S = 450 m2.',
      'q8': 'Giải hệ thức Viète ra m = -1.'
    },
    multipleChoiceScore: 3.0,
    essayScore: 2.5,
    totalScore: 9.2,
    teacherFeedback: 'Tiến bộ vượt bậc so với bài kiểm tra trước!',
    receiptCode: 'EDX-SUB-2B88Z',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_05',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v105`,
    variantCode: '105',
    studentName: 'Phạm Thu Trang',
    studentDob: '30/11/2008',
    className: '10A1',
    startedAt: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 2.1).toISOString(),
    status: 'graded',
    answers: { 'q1': 'opt_A', 'q2': 'opt_A', 'q3': 'opt_B', 'q4': 'opt_A', 'q5': 'opt_A', 'q6': 'opt_A', 'q7': 'Diện tích 450m2' },
    multipleChoiceScore: 2.5,
    essayScore: 2.0,
    totalScore: 7.5,
    teacherFeedback: 'Nắm vững kiến thức cơ bản, cần rèn thêm cách trình bày bài toán cực trị.',
    receiptCode: 'EDX-SUB-5P91L',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_06',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v106`,
    variantCode: '106',
    studentName: 'Vũ Đức Nam',
    studentDob: '12/06/2008',
    className: '10A1',
    startedAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 2.7).toISOString(),
    status: 'graded',
    answers: { 'q1': 'opt_A', 'q2': 'opt_B', 'q3': 'opt_C', 'q4': 'opt_A', 'q5': 'opt_B', 'q6': 'opt_A' },
    multipleChoiceScore: 2.0,
    essayScore: 1.5,
    totalScore: 6.0,
    teacherFeedback: 'Cần ôn lại phương pháp lập bảng biến thiên của hàm bậc hai.',
    receiptCode: 'EDX-SUB-6V18M',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_07',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v107`,
    variantCode: '107',
    studentName: 'Đặng Ngọc Ánh',
    studentDob: '19/08/2008',
    className: '10A2',
    startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 3.2).toISOString(),
    status: 'graded',
    answers: { 'q1': 'opt_A', 'q2': 'opt_A', 'q3': 'opt_A', 'q4': 'opt_A', 'q5': 'opt_B', 'q6': 'opt_A', 'q7': 'Tìm được x = 15m, S = 450m2.' },
    multipleChoiceScore: 2.5,
    essayScore: 2.5,
    totalScore: 8.2,
    teacherFeedback: 'Bài làm tốt, tính toán cẩn thận.',
    receiptCode: 'EDX-SUB-7A44K',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_08',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v108`,
    variantCode: '108',
    studentName: 'Đỗ Minh Khang',
    studentDob: '11/02/2008',
    className: '10A2',
    startedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    status: 'graded',
    answers: { 'q1': 'opt_A', 'q2': 'opt_A', 'q3': 'opt_B', 'q4': 'opt_A', 'q5': 'opt_A', 'q6': 'opt_B' },
    multipleChoiceScore: 2.0,
    essayScore: 2.0,
    totalScore: 7.0,
    teacherFeedback: 'Làm tốt phần tự luận, chú ý phân biệt tập nghiệm các bất phương trình.',
    receiptCode: 'EDX-SUB-8K92X',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_09',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v109`,
    variantCode: '109',
    studentName: 'Phan Thị Thanh Hằng',
    studentDob: '03/07/2008',
    className: '10A2',
    startedAt: new Date(Date.now() - 3600000 * 1.9).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 1.1).toISOString(),
    status: 'graded',
    answers: { 'q1': 'opt_A', 'q2': 'opt_C', 'q3': 'opt_B', 'q4': 'opt_A', 'q5': 'opt_A', 'q6': 'opt_B' },
    multipleChoiceScore: 2.0,
    essayScore: 1.5,
    totalScore: 6.2,
    teacherFeedback: 'Khá, cần rèn luyện thêm tốc độ làm bài trắc nghiệm.',
    receiptCode: 'EDX-SUB-9H33T',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_10',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v110`,
    variantCode: '110',
    studentName: 'Dương Gia Bảo',
    studentDob: '28/05/2008',
    className: '10A2',
    startedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    status: 'graded',
    answers: { 'q1': 'opt_A', 'q2': 'opt_A', 'q3': 'opt_A', 'q4': 'opt_A', 'q5': 'opt_A', 'q6': 'opt_A', 'q7': 'S max = 450m2 khi x = 15m' },
    multipleChoiceScore: 3.0,
    essayScore: 2.2,
    totalScore: 8.5,
    teacherFeedback: 'Rất tốt, phát huy tư duy logic trong các bài toán thực tế.',
    receiptCode: 'EDX-SUB-10B71',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  },
  {
    id: 'sub_demo_11',
    assignmentId: 'asg_demo_01',
    variantId: `${INITIAL_EXAM.id}_v101`,
    variantCode: '101',
    studentName: 'Nguyễn Hải Đăng',
    studentDob: '14/10/2008',
    className: '10A1',
    startedAt: new Date(Date.now() - 3600000 * 2.2).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    status: 'graded',
    answers: { 'q1': 'opt_B', 'q2': 'opt_C', 'q3': 'opt_B', 'q4': 'opt_A' },
    multipleChoiceScore: 1.5,
    essayScore: 1.0,
    totalScore: 4.5,
    teacherFeedback: 'Chưa đạt yêu cầu, cần gặp giáo viên bộ môn để củng cố lại kiến thức chương 3.',
    receiptCode: 'EDX-SUB-11D50',
    gradedBy: 'Thầy Nguyễn Văn An',
    isVerifiedStudent: true,
    syncedToSheets: true
  }
];

export const INITIAL_TEXTBOOKS: TextbookPdf[] = [];

