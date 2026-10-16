import React, { useState } from 'react';
import { Users, Plus, Trash2, X, Check, Edit2, GraduationCap } from 'lucide-react';
import { ClassInfo, StudentRosterItem } from '../types';
import { ALL_CURRENT_SUBJECTS } from '../lib/subjects';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassInfo[];
  onSaveClass: (cls: ClassInfo) => Promise<void>;
  onDeleteClass: (classId: string) => Promise<void>;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  classes,
  onSaveClass,
  onDeleteClass
}) => {
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('10');
  const [subject, setSubject] = useState('Toán học');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [studentCount, setStudentCount] = useState(35);
  const [rosterText, setRosterText] = useState('');

  if (!isOpen) return null;

  const handleOpenNewClass = () => {
    setEditingClass(null);
    setClassName('');
    setGrade('10');
    setSubject('Toán học');
    setCustomSubjectName('');
    setStudentCount(35);
    setRosterText('');
  };

  const handleOpenEditClass = (cls: ClassInfo) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setGrade(cls.grade);
    setSubject(cls.subject);
    setCustomSubjectName('');
    setStudentCount(cls.studentCount);
    if (cls.studentRoster) {
      setRosterText(cls.studentRoster.map(s => `${s.name}, ${s.dob}`).join('\n'));
    } else {
      setRosterText('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    // Parse roster if entered
    let roster: StudentRosterItem[] = [];
    if (rosterText.trim()) {
      roster = rosterText.split('\n').filter(line => line.trim().length > 0).map((line, idx) => {
        const parts = line.split(',');
        return {
          id: `hs_${Date.now()}_${idx}`,
          name: parts[0]?.trim() || `Học sinh ${idx + 1}`,
          dob: parts[1]?.trim() || '15/04/2008'
        };
      });
    }

    const effectiveSubject = subject === 'Môn khác' && customSubjectName.trim()
      ? customSubjectName.trim()
      : subject;

    const cls: ClassInfo = {
      id: editingClass ? editingClass.id : `class_${Date.now()}`,
      teacherId: 'teacher_default_edunexa',
      name: className.trim(),
      grade,
      subject: effectiveSubject,
      studentCount: roster.length > 0 ? roster.length : studentCount,
      studentRoster: roster.length > 0 ? roster : undefined,
      createdAt: editingClass ? editingClass.createdAt : new Date().toISOString()
    };

    await onSaveClass(cls);
    setEditingClass(null);
    setClassName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-800">Quản Lý Lớp Học & Học Sinh</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Classes List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Danh sách lớp ({classes.length} lớp):</span>
            <button
              onClick={handleOpenNewClass}
              className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm lớp mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
            {classes.map(cls => (
              <div
                key={cls.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">Lớp {cls.name}</span>
                  <span className="text-slate-400 block text-[11px]">
                    Khối {cls.grade} • {cls.studentCount} HS
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditClass(cls)}
                    className="p-1 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteClass(cls.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add / Edit Form */}
        <form onSubmit={handleSave} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800">
            {editingClass ? `Chỉnh sửa Lớp ${editingClass.name}` : 'Thêm lớp học mới'}
          </h4>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên lớp</label>
              <input
                type="text"
                required
                placeholder="10A1"
                value={className}
                onChange={e => setClassName(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Khối</label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="10">Lớp 10</option>
                <option value="11">Lớp 11</option>
                <option value="12">Lớp 12</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Sĩ số (HS)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={studentCount}
                onChange={e => setStudentCount(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Môn học phụ trách</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-medium"
            >
              {ALL_CURRENT_SUBJECTS.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.shortName})
                </option>
              ))}
            </select>
          </div>

          {subject === 'Môn khác' && (
            <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 space-y-1">
              <label className="block text-[11px] font-bold text-purple-900">
                ✨ Nhập tên môn học khác:
              </label>
              <input
                type="text"
                required
                value={customSubjectName}
                onChange={e => setCustomSubjectName(e.target.value)}
                placeholder="Ví dụ: Tiếng Pháp, STEM, Kỹ năng sống..."
                className="w-full text-xs p-2 border border-purple-300 rounded-lg bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Danh sách học sinh (Mỗi dòng một em: Tên, Ngày sinh DD/MM/YYYY):
            </label>
            <textarea
              rows={3}
              placeholder={`Nguyễn Minh Quân, 15/04/2008\nTrần Thị Mai Phương, 22/09/2008`}
              value={rosterText}
              onChange={e => setRosterText(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              {editingClass ? 'Cập nhật Lớp' : 'Thêm Lớp Mới'}
            </button>
          </div>
        </form>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
