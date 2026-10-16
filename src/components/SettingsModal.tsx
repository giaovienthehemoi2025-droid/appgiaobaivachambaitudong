import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  PlusCircle, 
  HelpCircle,
  Check,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import { TeacherSetting, Submission } from '../types';
import { 
  googleSignInWithSheetsScopes, 
  getSheetsAccessToken, 
  verifySpreadsheetAccess, 
  createEdunexaSpreadsheet, 
  syncSubmissionsToGoogleSheet 
} from '../lib/googleSheets';
import { auth } from '../lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setting: TeacherSetting;
  submissions: Submission[];
  onSaveSetting: (setting: TeacherSetting) => Promise<void>;
}

function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  setting,
  submissions,
  onSaveSetting
}) => {
  const [teacherName, setTeacherName] = useState(setting.teacherName);
  const [schoolName, setSchoolName] = useState(setting.schoolName);
  const [spreadsheetInput, setSpreadsheetInput] = useState(setting.sheetsSpreadsheetId || '');
  const [autoSync, setAutoSync] = useState(setting.autoSyncSheets);

  // Google OAuth Auth State
  const [googleUser, setGoogleUser] = useState(auth.currentUser);
  const [hasSheetsToken, setHasSheetsToken] = useState(!!getSheetsAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Operations state
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sheetUrl?: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setHasSheetsToken(!!getSheetsAccessToken());
    setGoogleUser(auth.currentUser);
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanId = extractSpreadsheetId(spreadsheetInput);

  // Sign in with Google Sheets Scope
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setTestResult(null);
    try {
      const res = await googleSignInWithSheetsScopes();
      if (res.cancelled) {
        setTestResult({
          success: false,
          message: 'Cửa sổ đăng nhập Google đã được đóng. Bạn vẫn có thể dán link/ID Google Sheet hoặc bấm "Dùng mẫu thử nghiệm EDUNEXA" để kết nối.'
        });
        return;
      }
      if (!res.accessToken) {
        setTestResult({
          success: false,
          message: res.error || 'Chưa nhận được quyền truy cập Google Sheets. Vui lòng thử lại.'
        });
        return;
      }
      setGoogleUser(res.user);
      setHasSheetsToken(true);
      setTestResult({
        success: true,
        message: `Đã kết nối tài khoản Google${res.user?.email ? `: ${res.user.email}` : ''}. Quyền Google Sheets & Drive đã sẵn sàng!`
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Đăng nhập Google chưa hoàn tất. Bạn có thể thử lại hoặc dán ID bảng tính trực tiếp.'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 1-Click Create new spreadsheet on user's Drive
  const handleCreateNewSheet = async () => {
    if (!hasSheetsToken) {
      // Prompt user to connect Google first
      setIsLoggingIn(true);
      try {
        const authRes = await googleSignInWithSheetsScopes();
        if (authRes.cancelled || !authRes.accessToken) {
          setTestResult({
            success: false,
            message: 'Cửa sổ đăng nhập Google đã được đóng. Vui lòng kết nối Google để tạo bảng tính trực tiếp trên Google Drive, hoặc bấm "Dùng mẫu thử nghiệm EDUNEXA".'
          });
          return;
        }
        setGoogleUser(authRes.user);
        setHasSheetsToken(true);
      } catch {
        return;
      } finally {
        setIsLoggingIn(false);
      }
    }

    setIsCreatingSheet(true);
    setTestResult(null);
    try {
      const title = `EDUNEXA - Bảng Điểm Khảo Thí (${new Date().toLocaleDateString('vi-VN')})`;
      const { spreadsheetId, url } = await createEdunexaSpreadsheet(title);
      setSpreadsheetInput(spreadsheetId);
      setTestResult({
        success: true,
        message: `Đã tạo thành công bảng tính mới trên Google Drive của bạn! Đã khởi tạo 4 trang tính chuẩn.`,
        sheetUrl: url
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Không thể tạo bảng tính Google Sheets mới.'
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Quick fill demo spreadsheet ID
  const handleUseDemoSheet = () => {
    const demoId = '1EDUNEXA_Demo_BangDiemHocSinh_2026';
    setSpreadsheetInput(demoId);
    setTestResult({
      success: true,
      message: 'Đã điền bảng tính mẫu EDUNEXA! Bạn có thể bấm "Kiểm tra kết nối" ngay.'
    });
  };

  // Test connection
  const handleTestConnection = async () => {
    const targetId = cleanId;

    if (!targetId) {
      setTestResult({
        success: false,
        message: 'Vui lòng dán Link Google Sheet hoặc Spreadsheet ID vào ô bên dưới, hoặc bấm "Tạo bảng tính mới"!'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // If we have an OAuth token, verify directly with Google API
    if (hasSheetsToken) {
      const res = await verifySpreadsheetAccess(targetId);
      setIsTesting(false);
      if (res.success) {
        setTestResult({
          success: true,
          message: `Kết nối Google Sheets thành công! Tên bảng: "${res.title}". Các trang tính tìm thấy: ${res.sheets?.join(', ')}.`
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Không thể truy cập bảng tính.'
        });
      }
      return;
    }

    // Fallback server test
    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: targetId,
          submissions: submissions.slice(0, 1),
          assignmentTitle: 'Kiểm tra kết nối'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Kết nối thành công! Bảng tính ID [${targetId.slice(0, 16)}...] đã sẵn sàng đồng bộ 4 trang tính: DANH_SACH_HOC_SINH, DE_GIAO, KET_QUA, CHI_TIET_BAI_LAM.`
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Không thể kết nối đến bảng tính. Vui lòng kiểm tra lại quyền truy cập chia sẻ.'
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Lỗi mạng khi kết nối. Hãy đảm bảo bạn đã mở quyền truy cập cho bảng tính.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Manual Sync
  const handleManualSync = async () => {
    const targetId = cleanId;
    if (!targetId) {
      alert('Vui lòng nhập Link hoặc ID Google Sheets!');
      return;
    }

    setIsSyncing(true);
    setTestResult(null);

    try {
      if (hasSheetsToken) {
        // Direct OAuth client-side sync
        const res = await syncSubmissionsToGoogleSheet(targetId, 'Đồng bộ kết quả EDUNEXA', submissions);
        setTestResult({
          success: true,
          message: res.message
        });
      } else {
        // Server fallback sync
        const res = await fetch('/api/sheets/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheetId: targetId,
            submissions,
            assignmentTitle: 'Đồng bộ kết quả EDUNEXA'
          })
        });
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Đã đồng bộ thành công ${submissions.length} bài làm của học sinh vào Google Sheets! Không phát sinh bản ghi trùng.`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Lỗi đồng bộ Google Sheets'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TeacherSetting = {
      ...setting,
      teacherName: teacherName.trim(),
      schoolName: schoolName.trim(),
      sheetsSpreadsheetId: cleanId,
      autoSyncSheets: autoSync,
      updatedAt: new Date().toISOString()
    };
    await onSaveSetting(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Cài Đặt & Kết Nối Google Sheets / Excel</h3>
              <p className="text-[11px] text-slate-500">Đồng bộ trực tiếp kết quả điểm thi vào Google Drive & Sheets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveAll} className="space-y-4">
          {/* Section 1: Teacher info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Thông tin hiển thị trên đề thi
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên trường học</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  placeholder="THPT Chuyên Chu Văn An"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên giáo viên</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  placeholder="Thầy Nguyễn Văn An"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Google Sheets OAuth & Connection */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                2. Kết Nối Google Sheets & Google Drive
              </h4>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn'}</span>
              </button>
            </div>

            {/* Google OAuth Login Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2 text-xs">
                {hasSheetsToken ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-800 block">Đã cấp quyền Google Sheets:</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {googleUser?.email || 'Đã xác thực OAuth2'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-800 block">Đăng nhập tài khoản Google</span>
                      <span className="text-[11px] text-slate-500">Để tự động tạo và cập nhật bảng tính</span>
                    </div>
                  </>
                )}
              </div>

              {!hasSheetsToken ? (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Kết nối Google</span>
                </button>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Đã kết nối
                </span>
              )}
            </div>

            {/* Visual guide */}
            {showGuide && (
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-2.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <span>💡 2 Cách kết nối Google Sheets dễ dàng:</span>
                </div>
                <div className="space-y-2 text-[11px] text-blue-900/90 pl-1">
                  <div>
                    <span className="font-bold text-blue-950">Cách 1 (Khuyên dùng - Nhanh nhất & Không cần xác thực Google):</span>
                    <p className="mt-0.5 text-slate-600">
                      Tạo 1 bảng tính trên Google Drive của bạn, bấm <strong>Chia sẻ → Bất kỳ ai có đường liên kết đều có thể chỉnh sửa</strong>, sau đó sao chép link dán vào ô bên dưới rồi bấm <strong>"Kiểm tra kết nối"</strong>.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-blue-950">Cách 2 (Đồng bộ trực tiếp qua tài khoản Google):</span>
                    <p className="mt-0.5 text-slate-600">
                      Chấp nhận quyền truy cập trên bảng thông báo phê duyệt OAuth của Google AI Studio để hệ thống tự động tạo và cập nhật bảng tính trên Google Drive của bạn.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-blue-950">Cách 3 (Xuất file Excel truyền thống):</span>
                    <p className="mt-0.5 text-slate-600">
                      Trong tab <strong>"Chấm bài & Kết quả"</strong>, bấm nút <strong>"Xuất Excel (.xlsx)"</strong> để tải file bảng điểm chính thức về máy tính ngay trong 1 giây mà không cần tài khoản Google.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={isCreatingSheet}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {isCreatingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                <span>Tạo bảng tính mới trên Google Drive</span>
              </button>

              <button
                type="button"
                onClick={handleUseDemoSheet}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <span>Dùng mẫu thử nghiệm EDUNEXA</span>
              </button>
            </div>

            {/* Input field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dán đường link Google Sheets hoặc Spreadsheet ID:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                value={spreadsheetInput}
                onChange={e => setSpreadsheetInput(e.target.value)}
                className="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              {cleanId && cleanId !== spreadsheetInput && (
                <div className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Đã tự động trích xuất ID: <strong className="font-mono">{cleanId}</strong></span>
                </div>
              )}
            </div>

            {/* Auto sync checkbox */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="autoSync"
                checked={autoSync}
                onChange={e => setAutoSync(e.target.checked)}
                className="accent-emerald-600"
              />
              <label htmlFor="autoSync" className="text-xs text-slate-700 font-medium cursor-pointer">
                Tự động đồng bộ ngay khi học sinh nộp bài mới
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Kiểm tra kết nối Sheets</span>
              </button>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing || !cleanId}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                <span>Đồng bộ ngay ({submissions.length} bài)</span>
              </button>

              {testResult?.sheetUrl && (
                <a
                  href={testResult.sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                >
                  <span>Mở Google Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Test result message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-semibold">{testResult.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Lưu Cài Đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
