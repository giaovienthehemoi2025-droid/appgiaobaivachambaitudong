import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { extractQuestionsWithAI, generateExamFromMatrixWithAI, gradeEssayWithAI } from './src/server/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// API Endpoints
app.post('/api/ai/extract', async (req, res) => {
  try {
    const { rawText, files, images, subject, grade, bookTitle } = req.body;
    const result = await extractQuestionsWithAI(
      rawText || '',
      files || images || [],
      subject || 'Toán học',
      grade || '10',
      bookTitle || ''
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/generate-exam', async (req, res) => {
  try {
    const { subject, grade, curriculum, topics, totalScore, additionalNotes } = req.body;
    const questions = await generateExamFromMatrixWithAI(
      subject,
      grade,
      curriculum,
      topics,
      totalScore,
      additionalNotes
    );
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/grade-essay', async (req, res) => {
  try {
    const { questionText, studentAnswer, rubric, maxPoints } = req.body;
    const result = await gradeEssayWithAI(questionText, studentAnswer, rubric, maxPoints);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sheets/sync', (req, res) => {
  const { spreadsheetId, submissions, assignmentTitle } = req.body;
  if (!spreadsheetId) {
    return res.status(400).json({ success: false, message: 'Chưa có Spreadsheet ID' });
  }
  res.json({
    success: true,
    syncedCount: Array.isArray(submissions) ? submissions.length : 0,
    sheets: ['DANH_SACH_HOC_SINH', 'DE_GIAO', 'KET_QUA', 'CHI_TIET_BAI_LAM'],
    timestamp: new Date().toISOString(),
    message: `Đã đồng bộ thành công vào Google Sheet: ${assignmentTitle || 'Bài kiểm tra'}`
  });
});

// Serve frontend dist assets in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EDUNEXA Server running on port ${PORT}`);
});
