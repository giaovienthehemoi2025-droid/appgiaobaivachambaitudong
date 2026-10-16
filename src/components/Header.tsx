import React from 'react';
import { GraduationCap, Users, Settings, Smartphone, Award, ExternalLink } from 'lucide-react';
import { TeacherSetting } from '../types';

interface HeaderProps {
  teacherSetting: TeacherSetting;
  onOpenClassManager: () => void;
  onOpenSettings: () => void;
  onOpenStudentPreview: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  teacherSetting,
  onOpenClassManager,
  onOpenSettings,
  onOpenStudentPreview
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-cyan-200">
                EDUNEXA AI
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600/60 text-blue-100 border border-blue-400/30 uppercase tracking-widest">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Hệ thống Giao bài & Chấm bài Chuẩn Ma trận BGD
            </p>
          </div>
        </div>

        {/* Center: School and Teacher Info */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300 font-medium">{teacherSetting.schoolName}</span>
          <span className="text-slate-500">•</span>
          <span className="text-blue-300 font-semibold">{teacherSetting.teacherName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenStudentPreview}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white transition-colors shadow-sm cursor-pointer"
            title="Mở cổng làm bài của học sinh để thử nghiệm trực tiếp"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trang Học sinh</span>
            <ExternalLink className="w-3 h-3 text-emerald-200" />
          </button>

          <button
            onClick={onOpenClassManager}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Quản lý Lớp</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Cài đặt & Sheets</span>
          </button>
        </div>
      </div>
    </header>
  );
};
