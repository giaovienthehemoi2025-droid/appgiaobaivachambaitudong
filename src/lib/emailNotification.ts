import { Submission, EmailNotificationRecord, TeacherSetting } from '../types';

const EMAIL_LOGS_KEY = 'edunexa_email_notification_logs';

/**
 * Generate formatted HTML template for student score notification
 */
export function generateScoreReportEmailHtml(params: {
  studentName: string;
  className: string;
  receiptCode: string;
  examTitle: string;
  multipleChoiceScore: number;
  essayScore: number;
  totalScore: number;
  teacherFeedback?: string;
  teacherName: string;
  schoolName: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Thông Báo Kết Quả Bài Kiểm Tra - ${params.examTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <div style="font-size: 22px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px;">EDUNEXA AI</div>
      <div style="font-size: 13px; color: #bfdbfe; font-weight: 500;">HỆ THỐNG KHẢO THÍ & BÁO ĐIỂM TỰ ĐỘNG</div>
      <div style="font-size: 12px; color: #93c5fd; margin-top: 6px;">${params.schoolName} • Giáo viên: ${params.teacherName}</div>
    </div>

    <!-- Main Body -->
    <div style="padding: 24px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
        Kính gửi học sinh: ${params.studentName} (${params.className})
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Bài kiểm tra <strong>"${params.examTitle}"</strong> của bạn đã được giáo viên hoàn tất chấm điểm và nhận xét. Dưới đây là kết quả chính thức:
      </p>

      <!-- Score Card Box -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px; font-size: 13px;">
          <span style="color: #64748b;">Mã biên nhận bài thi:</span>
          <strong style="color: #2563eb; font-family: monospace; font-size: 14px;">${params.receiptCode}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; font-size: 13px;">
          <span style="color: #64748b;">Điểm Trắc nghiệm:</span>
          <strong style="color: #1e293b;">${params.multipleChoiceScore} điểm</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 12px; font-size: 13px;">
          <span style="color: #64748b;">Điểm Tự luận:</span>
          <strong style="color: #1e293b;">${params.essayScore} điểm</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 15px; font-weight: 700; color: #0f172a;">TỔNG ĐIỂM CHÍNH THỨC:</span>
          <span style="font-size: 24px; font-weight: 800; color: #16a34a;">${params.totalScore} / 10</span>
        </div>
      </div>

      <!-- Teacher Feedback -->
      ${params.teacherFeedback ? `
      <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #854d0e; text-transform: uppercase; margin-bottom: 4px;">
          Lời nhận xét của Giáo viên:
        </div>
        <div style="font-size: 13px; color: #713f12; font-style: italic; line-height: 1.5;">
          "${params.teacherFeedback}"
        </div>
      </div>
      ` : ''}

      <div style="text-align: center; padding-top: 10px;">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
          Bạn có thể dùng mã biên nhận <strong>${params.receiptCode}</strong> để tra cứu chi tiết bài làm tại cổng thi EDUNEXA.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      Email tự động được gửi từ hệ thống EDUNEXA AI • Vui lòng không phản hồi trực tiếp email này.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Mock / Integration email dispatch service
 * Simulates sending an automated score notification to the student's email address
 */
export async function sendGradedNotificationEmail(params: {
  submission: Submission;
  examTitle: string;
  teacherSetting: TeacherSetting;
  customRecipientEmail?: string;
}): Promise<{ success: boolean; message: string; record: EmailNotificationRecord }> {
  // Simulate network latency (300-500ms)
  await new Promise(resolve => setTimeout(resolve, 350));

  const recipient = params.customRecipientEmail || params.submission.studentEmail || `${params.submission.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.vn`;

  const emailRecord: EmailNotificationRecord = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    submissionId: params.submission.id,
    receiptCode: params.submission.receiptCode,
    recipientEmail: recipient,
    studentName: params.submission.studentName,
    className: params.submission.className,
    examTitle: params.examTitle,
    totalScore: params.submission.totalScore,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    teacherFeedback: params.submission.teacherFeedback
  };

  // Persist to local notification log
  saveEmailLog(emailRecord);

  console.log(`[EDUNEXA EMAIL SERVICE] Automated email delivered to: ${recipient} | Student: ${params.submission.studentName} | Score: ${params.submission.totalScore}`);

  return {
    success: true,
    message: `Đã gửi email thông báo kết quả thành công tới: ${recipient}`,
    record: emailRecord
  };
}

/**
 * Retrieve saved email notification logs
 */
export function getEmailNotificationLogs(): EmailNotificationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save an email record to local logs
 */
function saveEmailLog(record: EmailNotificationRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getEmailNotificationLogs();
    const updated = [record, ...existing.slice(0, 99)]; // keep latest 100
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear email logs
 */
export function clearEmailNotificationLogs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(EMAIL_LOGS_KEY);
}
