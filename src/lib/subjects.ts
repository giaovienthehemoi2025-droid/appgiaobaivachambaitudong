/**
 * EDUNEXA 1.0 - Comprehensive Vietnamese K-12 Curriculum Subjects
 * Chương trình Giáo dục Phổ thông 2018 & Hiện hành của Bộ GD&ĐT
 */

export interface SubjectItem {
  id: string;
  name: string;
  shortName: string;
  group: 'natural' | 'social' | 'language' | 'tech_arts' | 'other';
  color: string;
  grades: string[]; // ['1', '2', ..., '12']
}

export const ALL_CURRENT_SUBJECTS: SubjectItem[] = [
  // 1. Toán học
  {
    id: 'toan',
    name: 'Toán học',
    shortName: 'Toán',
    group: 'natural',
    color: 'blue',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 2. Ngữ văn / Tiếng Việt
  {
    id: 'van',
    name: 'Ngữ văn',
    shortName: 'Văn',
    group: 'social',
    color: 'rose',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 3. Tiếng Anh
  {
    id: 'anh',
    name: 'Tiếng Anh',
    shortName: 'Anh',
    group: 'language',
    color: 'amber',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 4. Vật lí
  {
    id: 'vat_li',
    name: 'Vật lí',
    shortName: 'Lí',
    group: 'natural',
    color: 'indigo',
    grades: ['6', '7', '8', '9', '10', '11', '12']
  },
  // 5. Hóa học
  {
    id: 'hoa_hoc',
    name: 'Hóa học',
    shortName: 'Hóa',
    group: 'natural',
    color: 'teal',
    grades: ['8', '9', '10', '11', '12']
  },
  // 6. Sinh học
  {
    id: 'sinh_hoc',
    name: 'Sinh học',
    shortName: 'Sinh',
    group: 'natural',
    color: 'emerald',
    grades: ['6', '7', '8', '9', '10', '11', '12']
  },
  // 7. Khoa học tự nhiên (THCS - môn tích hợp Lí, Hóa, Sinh)
  {
    id: 'khtn',
    name: 'Khoa học tự nhiên',
    shortName: 'KHTN',
    group: 'natural',
    color: 'cyan',
    grades: ['6', '7', '8', '9']
  },
  // 8. Lịch sử
  {
    id: 'lich_su',
    name: 'Lịch sử',
    shortName: 'Sử',
    group: 'social',
    color: 'amber',
    grades: ['6', '7', '8', '9', '10', '11', '12']
  },
  // 9. Địa lí
  {
    id: 'dia_li',
    name: 'Địa lí',
    shortName: 'Địa',
    group: 'social',
    color: 'lime',
    grades: ['6', '7', '8', '9', '10', '11', '12']
  },
  // 10. Lịch sử và Địa lí (Tiểu học & THCS)
  {
    id: 'su_dia',
    name: 'Lịch sử và Địa lí',
    shortName: 'Sử - Địa',
    group: 'social',
    color: 'orange',
    grades: ['4', '5', '6', '7', '8', '9']
  },
  // 11. Giáo dục Kinh tế và Pháp luật (GDKT&PL - Cấp THPT)
  {
    id: 'gdkt_pl',
    name: 'Giáo dục Kinh tế và Pháp luật',
    shortName: 'GDKT & PL',
    group: 'social',
    color: 'purple',
    grades: ['10', '11', '12']
  },
  // 12. Giáo dục công dân (GDCD - Cấp THCS)
  {
    id: 'gdcd',
    name: 'Giáo dục công dân',
    shortName: 'GDCD',
    group: 'social',
    color: 'violet',
    grades: ['6', '7', '8', '9']
  },
  // 13. Tin học
  {
    id: 'tin_hoc',
    name: 'Tin học',
    shortName: 'Tin',
    group: 'tech_arts',
    color: 'sky',
    grades: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 14. Công nghệ
  {
    id: 'cong_nghe',
    name: 'Công nghệ',
    shortName: 'Công nghệ',
    group: 'tech_arts',
    color: 'slate',
    grades: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 15. Giáo dục quốc phòng và an ninh (GDQP-AN)
  {
    id: 'gdqp_an',
    name: 'Giáo dục quốc phòng và an ninh',
    shortName: 'GDQP-AN',
    group: 'social',
    color: 'green',
    grades: ['10', '11', '12']
  },
  // 16. Âm nhạc
  {
    id: 'am_nhac',
    name: 'Âm nhạc',
    shortName: 'Nhạc',
    group: 'tech_arts',
    color: 'pink',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 17. Mỹ thuật
  {
    id: 'my_thuat',
    name: 'Mỹ thuật',
    shortName: 'Mỹ thuật',
    group: 'tech_arts',
    color: 'fuchsia',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 18. Hoạt động trải nghiệm, hướng nghiệp
  {
    id: 'hdtn_hn',
    name: 'Hoạt động trải nghiệm, hướng nghiệp',
    shortName: 'HĐTN',
    group: 'other',
    color: 'emerald',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 19. Giáo dục thể chất
  {
    id: 'gdtc',
    name: 'Giáo dục thể chất',
    shortName: 'Thể chất',
    group: 'tech_arts',
    color: 'amber',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  // 20. Tự nhiên và Xã hội (Tiểu học lớp 1, 2, 3)
  {
    id: 'tn_xh',
    name: 'Tự nhiên và Xã hội',
    shortName: 'TN-XH',
    group: 'natural',
    color: 'teal',
    grades: ['1', '2', '3']
  },
  // 21. Khoa học (Tiểu học lớp 4, 5)
  {
    id: 'khoa_hoc_th',
    name: 'Khoa học',
    shortName: 'Khoa học',
    group: 'natural',
    color: 'cyan',
    grades: ['4', '5']
  },
  // 22. Đạo đức (Tiểu học)
  {
    id: 'dao_duc',
    name: 'Đạo đức',
    shortName: 'Đạo đức',
    group: 'social',
    color: 'purple',
    grades: ['1', '2', '3', '4', '5']
  },
  // 23. Môn khác (Tự chọn / Ngoại ngữ 2 / Tự thiết kế)
  {
    id: 'mon_khac',
    name: 'Môn khác',
    shortName: 'Môn khác',
    group: 'other',
    color: 'slate',
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  }
];

export const CURRICULUM_SERIES = [
  'Kết nối tri thức với cuộc sống (NXB GDVN)',
  'Chân trời sáng tạo (NXB GDVN)',
  'Cánh diều (NXB ĐH Sư phạm)',
  'Cùng học để phát triển năng lực',
  'Vì sự bình đẳng và dân chủ trong giáo dục',
  'SGK Chương trình Chuẩn / Hiện hành',
  'Bộ sách khác'
];

export const GRADE_LEVELS = [
  { value: '1', label: 'Lớp 1 (Tiểu học)' },
  { value: '2', label: 'Lớp 2 (Tiểu học)' },
  { value: '3', label: 'Lớp 3 (Tiểu học)' },
  { value: '4', label: 'Lớp 4 (Tiểu học)' },
  { value: '5', label: 'Lớp 5 (Tiểu học)' },
  { value: '6', label: 'Lớp 6 (THCS)' },
  { value: '7', label: 'Lớp 7 (THCS)' },
  { value: '8', label: 'Lớp 8 (THCS)' },
  { value: '9', label: 'Lớp 9 (THCS)' },
  { value: '10', label: 'Lớp 10 (THPT)' },
  { value: '11', label: 'Lớp 11 (THPT)' },
  { value: '12', label: 'Lớp 12 (THPT)' }
];
