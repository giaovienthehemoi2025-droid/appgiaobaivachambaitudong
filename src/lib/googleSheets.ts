import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth, fetchAllSubmissions } from './firebase';
import { Submission, Question } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export const SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

export const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
];

// In-memory token storage (strictly NEVER stored in localStorage or sessionStorage as required by Security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;
let isGapiInitialized = false;

// Clear cached token on signout
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
    if (typeof window !== 'undefined' && window.gapi?.client) {
      window.gapi.client.setToken(null);
    }
  }
});

/**
 * Initializes the Google Sheets API client (gapi) and loads Discovery Docs
 */
export async function initGapiClient(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isGapiInitialized && window.gapi?.client?.sheets) return true;

  return new Promise((resolve) => {
    const setupGapi = () => {
      if (!window.gapi) {
        resolve(false);
        return;
      }

      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: firebaseConfig.apiKey,
            discoveryDocs: DISCOVERY_DOCS
          });

          if (cachedAccessToken) {
            window.gapi.client.setToken({ access_token: cachedAccessToken });
          }

          isGapiInitialized = true;
          resolve(true);
        } catch (err) {
          console.warn('GAPI client init warning (fallback to Sheets v4 REST API):', err);
          resolve(false);
        }
      });
    };

    if (window.gapi) {
      setupGapi();
    } else {
      const existingScript = document.getElementById('google-api-script');
      if (existingScript) {
        existingScript.addEventListener('load', setupGapi);
      } else {
        const script = document.createElement('script');
        script.id = 'google-api-script';
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = setupGapi;
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }
    }
  });
}

export interface AuthorizeResult {
  user: User | null;
  accessToken: string | null;
  cancelled?: boolean;
  error?: string;
}

/**
 * Authorize the user for Google Sheets using the existing oAuthClientId
 */
export async function authorizeUser(): Promise<AuthorizeResult> {
  try {
    isSigningIn = true;

    // 1. Try Google Identity Services (GIS) token client if available with oAuthClientId
    const oAuthClientId = (firebaseConfig as any).oAuthClientId;

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && oAuthClientId) {
      const tokenPromise = new Promise<string>((resolve) => {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: oAuthClientId,
            scope: SHEETS_SCOPES.join(' '),
            callback: (response: any) => {
              if (response.error) {
                // If user dismissed or closed
                resolve('');
              } else if (response.access_token) {
                resolve(response.access_token);
              } else {
                resolve('');
              }
            }
          });
          client.requestAccessToken();
        } catch {
          resolve('');
        }
      });

      try {
        const token = await tokenPromise;
        if (token) {
          cachedAccessToken = token;
          if (window.gapi?.client) {
            window.gapi.client.setToken({ access_token: token });
          }
          await initGapiClient().catch(() => {});
          return { user: auth.currentUser || null, accessToken: token };
        }
      } catch (gisErr) {
        console.warn('GIS Token Client fallback to Firebase GoogleAuthProvider:', gisErr);
      }
    }

    // 2. Firebase GoogleAuthProvider with popup (standard in AI Studio)
    const provider = new GoogleAuthProvider();
    SHEETS_SCOPES.forEach(scope => provider.addScope(scope));

    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      if (
        popupErr?.code === 'auth/popup-closed-by-user' ||
        popupErr?.code === 'auth/cancelled-popup-request' ||
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.message?.includes('popup-closed-by-user') ||
        popupErr?.message?.includes('popup-blocked')
      ) {
        console.info('Google sign-in popup was closed by user or dismissed.');
        return {
          user: auth.currentUser || null,
          accessToken: null,
          cancelled: true,
          error: 'Cửa sổ đăng nhập Google đã được đóng.'
        };
      }
      return {
        user: null,
        accessToken: null,
        cancelled: false,
        error: popupErr?.message || 'Không thể đăng nhập Google.'
      };
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      return {
        user: result.user || null,
        accessToken: null,
        error: 'Không nhận được Access Token từ Google OAuth. Vui lòng thử lại.'
      };
    }

    cachedAccessToken = credential.accessToken;

    if (typeof window !== 'undefined' && window.gapi?.client) {
      window.gapi.client.setToken({ access_token: cachedAccessToken });
    }

    await initGapiClient().catch(() => {});

    return {
      user: result.user || null,
      accessToken: cachedAccessToken
    };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-blocked' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      console.info('Google sign-in popup was closed by user.');
      return {
        user: auth.currentUser || null,
        accessToken: null,
        cancelled: true,
        error: 'Cửa sổ đăng nhập Google đã được đóng.'
      };
    }
    console.warn('Google Sheets Authorization Notice:', error?.message || error);
    return {
      user: null,
      accessToken: null,
      cancelled: false,
      error: error?.message || 'Không thể kết nối Google Sheets'
    };
  } finally {
    isSigningIn = false;
  }
}

/**
 * Backward compatibility alias for SettingsModal
 */
export const googleSignInWithSheetsScopes = authorizeUser;
export const authenticateGoogleSheets = authorizeUser;

/**
 * Get current cached access token or return null
 */
export function getSheetsAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Verify whether a spreadsheet is accessible with the token
 */
export async function verifySpreadsheetAccess(
  spreadsheetId: string, 
  token?: string
): Promise<{ success: boolean; title?: string; sheets?: string[]; error?: string }> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    return { success: false, error: 'Chưa đăng nhập tài khoản Google có quyền truy cập Sheets' };
  }

  // Try via gapi client first if available
  if (typeof window !== 'undefined' && window.gapi?.client?.sheets) {
    try {
      window.gapi.client.setToken({ access_token: activeToken });
      const res = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId
      });
      const data = res.result;
      const sheetTitles = (data.sheets || []).map((s: any) => s.properties?.title);
      return {
        success: true,
        title: data.properties?.title || 'Google Sheet',
        sheets: sheetTitles
      };
    } catch {
      // Fallback to direct REST API
    }
  }

  // REST API fallback
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { 
        success: false, 
        error: errJson.error?.message || `HTTP ${res.status}: Không tìm thấy bảng tính hoặc chưa được cấp quyền.` 
      };
    }

    const data = await res.json();
    const sheetTitles = (data.sheets || []).map((s: any) => s.properties?.title);

    return {
      success: true,
      title: data.properties?.title || 'Google Sheet',
      sheets: sheetTitles
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi mạng khi kiểm tra bảng tính' };
  }
}

/**
 * Create a new spreadsheet in user's Google Drive with the 4 standard EDUNEXA tabs
 */
export async function createEdunexaSpreadsheet(
  title: string,
  token?: string
): Promise<{ spreadsheetId: string; url: string }> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Vui lòng kết nối tài khoản Google trước khi tạo bảng tính');
  }

  const resource = {
    properties: {
      title: title || `EDUNEXA_BangDiem_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}`
    },
    sheets: [
      { properties: { title: 'DANH_SACH_HOC_SINH' } },
      { properties: { title: 'DE_GIAO' } },
      { properties: { title: 'KET_QUA' } },
      { properties: { title: 'CHI_TIET_BAI_LAM' } }
    ]
  };

  let spreadsheetId: string | null = null;

  // Try gapi client first
  if (typeof window !== 'undefined' && window.gapi?.client?.sheets) {
    try {
      window.gapi.client.setToken({ access_token: activeToken });
      const res = await window.gapi.client.sheets.spreadsheets.create({
        resource
      });
      spreadsheetId = res.result?.spreadsheetId;
    } catch {
      // Fallback to fetch
    }
  }

  // Fallback REST API
  if (!spreadsheetId) {
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resource)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Không thể tạo bảng tính Google Sheets mới');
    }

    const data = await res.json();
    spreadsheetId = data.spreadsheetId;
  }

  if (!spreadsheetId) {
    throw new Error('Không nhận được ID bảng tính sau khi tạo');
  }

  // Initialize column headers for all 4 sheets
  await initSheetHeaders(spreadsheetId, activeToken);

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
}

/**
 * Ensure headers exist for the 4 tabs
 */
async function initSheetHeaders(spreadsheetId: string, token: string) {
  const headers = [
    {
      range: 'DANH_SACH_HOC_SINH!A1:D1',
      values: [['STT', 'Họ và tên học sinh', 'Lớp', 'Ngày sinh (DD/MM/YYYY)']]
    },
    {
      range: 'DE_GIAO!A1:F1',
      values: [['Mã đợt giao', 'Tiêu đề đề thi', 'Môn học', 'Khối', 'Thời lượng (phút)', 'Ngày tạo']]
    },
    {
      range: 'KET_QUA!A1:K1',
      values: [[
        'Mã biên nhận',
        'Họ và tên',
        'Lớp',
        'Ngày sinh',
        'Mã đề',
        'Điểm TN',
        'Điểm TL',
        'Tổng điểm',
        'Trạng thái',
        'Thời gian nộp',
        'Người chấm'
      ]]
    },
    {
      range: 'CHI_TIET_BAI_LAM!A1:H1',
      values: [[
        'Mã biên nhận',
        'Học sinh',
        'Lớp',
        'Câu hỏi số',
        'Nội dung câu',
        'Loại câu',
        'Câu trả lời của HS',
        'Đáp án chuẩn'
      ]]
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headers
    })
  });
}

/**
 * Export and sync assignment results from Firestore/client to Google Sheets
 * - Uses existing oAuthClientId
 * - Prevents duplicate entries via receiptCode
 */
export async function exportToSheet(
  spreadsheetId: string,
  assignmentTitle: string = 'Đồng bộ kết quả EDUNEXA',
  submissions?: Submission[],
  questions: Question[] = [],
  token?: string
): Promise<{ success: boolean; syncedCount: number; message: string }> {
  // 1. If submissions are not passed, load directly from Firestore
  let targetSubmissions = submissions;
  if (!targetSubmissions || targetSubmissions.length === 0) {
    targetSubmissions = await fetchAllSubmissions();
  }

  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    // Fallback to server sync proxy
    try {
      const serverRes = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          assignmentTitle,
          submissions: targetSubmissions || []
        })
      });
      if (serverRes.ok) {
        const data = await serverRes.json();
        return {
          success: true,
          syncedCount: data.syncedCount || (targetSubmissions?.length ?? 0),
          message: data.message || `Đã cập nhật dữ liệu điểm vào Google Sheet (${spreadsheetId})`
        };
      }
    } catch {
      // Continue
    }
    throw new Error('Chưa có token xác thực Google Sheets. Vui lòng bấm "Kết nối Google" trước.');
  }

  // 2. Fetch existing receipt codes from KET_QUA to prevent duplicates
  let existingReceipts = new Set<string>();
  try {
    const existingRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/KET_QUA!A2:A1000`,
      {
        headers: { Authorization: `Bearer ${activeToken}` }
      }
    );
    if (existingRes.ok) {
      const data = await existingRes.json();
      const rows = data.values || [];
      rows.forEach((r: any[]) => {
        if (r && r[0]) existingReceipts.add(r[0].toString().trim());
      });
    }
  } catch {
    // Tab might be uninitialized
  }

  // Filter only submissions not yet synced
  const newSubmissions = targetSubmissions.filter(s => !existingReceipts.has(s.receiptCode));

  if (newSubmissions.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      message: 'Tất cả bài nộp đã được đồng bộ trước đó. Không có dữ liệu mới trùng lặp.'
    };
  }

  // Build KET_QUA rows
  const ketQuaRows = newSubmissions.map(sub => [
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

  // Build CHI_TIET_BAI_LAM rows
  const chiTietRows: any[][] = [];
  newSubmissions.forEach(sub => {
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

      chiTietRows.push([
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

  // Append to KET_QUA
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/KET_QUA!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: ketQuaRows })
    }
  );

  // Append to CHI_TIET_BAI_LAM if questions exist
  if (chiTietRows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/CHI_TIET_BAI_LAM!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: chiTietRows })
      }
    );
  }

  return {
    success: true,
    syncedCount: newSubmissions.length,
    message: `Đã đồng bộ thành công ${newSubmissions.length} bài nộp từ Firestore vào Google Sheets!`
  };
}

/**
 * Backward compatibility alias for SettingsModal
 */
export const syncSubmissionsToGoogleSheet = exportToSheet;
export const syncFirestoreDataToSheet = exportToSheet;
