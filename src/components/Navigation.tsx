import React from 'react';
import { 
  BarChart3, 
  FolderArchive, 
  Grid3X3, 
  Shuffle, 
  CheckSquare,
  BookOpen
} from 'lucide-react';

export type MainTab = 'overview' | 'repository' | 'matrix' | 'assign' | 'submissions';

interface NavigationProps {
  currentTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  pendingEssayCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onChangeTab,
  pendingEssayCount
}) => {
  const tabs = [
    {
      id: 'overview' as MainTab,
      label: '1. Tổng quan',
      icon: BarChart3,
      desc: 'Báo cáo & Phổ điểm'
    },
    {
      id: 'repository' as MainTab,
      label: '2. Nguồn tài liệu & Tải file',
      icon: FolderArchive,
      desc: 'Tải SGK, Ảnh & Excel'
    },
    {
      id: 'matrix' as MainTab,
      label: '3. Tạo đề theo ma trận',
      icon: Grid3X3,
      desc: 'Ma trận & Bản đặc tả'
    },
    {
      id: 'assign' as MainTab,
      label: '4. Giao bài & Trộn đề',
      icon: Shuffle,
      desc: 'Trộn 10 mã & Gửi link HS'
    },
    {
      id: 'submissions' as MainTab,
      label: '5. Chấm bài & Google Sheets',
      icon: CheckSquare,
      desc: 'Chấm tự luận & Đồng bộ điểm',
      badge: pendingEssayCount > 0 ? pendingEssayCount : undefined
    }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
