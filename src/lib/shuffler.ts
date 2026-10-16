import { Exam, ExamVariant, Question, QuestionOption } from '../types';

/**
 * Deterministic PRNG using a seed string
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Fisher-Yates shuffle with seed
 */
function shuffleArray<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 17) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates exact 10 variants from a master exam.
 * Codes: 101, 102, 103, 104, 105, 106, 107, 108, 109, 110.
 * Keeps difficulty, cognitive level, points and topics identical.
 * Shuffles questions and shuffles options (A, B, C, D) while preserving correctOptionId!
 */
export function generate10Variants(masterExam: Exam): ExamVariant[] {
  const variants: ExamVariant[] = [];
  const variantCodes = ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110'];

  variantCodes.forEach((code, idx) => {
    // Generate a unique seed for this variant
    const seed = (idx + 1) * 7919;

    // Separate multiple choice and essay questions so essay usually stays at the end if desired,
    // or group questions by cognitive level / topic to preserve pedagogical structure
    const mcQuestions = masterExam.questions.filter(q => q.type !== 'essay');
    const essayQuestions = masterExam.questions.filter(q => q.type === 'essay');

    // Shuffle multiple choice questions
    const shuffledMC = shuffleArray(mcQuestions, seed + 101);

    // Shuffle options for each multiple choice question while preserving option IDs
    const transformedMC: Question[] = shuffledMC.map((q, qIndex) => {
      let shuffledOptions: QuestionOption[] | undefined = undefined;
      if (q.options && q.options.length > 0) {
        shuffledOptions = shuffleArray(q.options, seed + (qIndex + 1) * 31);
      }

      return {
        ...q,
        number: qIndex + 1,
        options: shuffledOptions
      };
    });

    // Append essay questions with renumbered sequence
    const transformedEssay: Question[] = essayQuestions.map((eq, eIndex) => ({
      ...eq,
      number: transformedMC.length + eIndex + 1
    }));

    const finalQuestions = [...transformedMC, ...transformedEssay];

    variants.push({
      variantId: `${masterExam.id}_v${code}`,
      variantCode: code,
      questions: finalQuestions
    });
  });

  return variants;
}

/**
 * Deterministic scoring algorithm for student submissions.
 * Checks multiple_choice, true_false, and fill_blank questions.
 * Returns { mcScore, essayPending, maxPossibleScore, details }
 */
export function calculateAutoScore(
  questions: Question[],
  answers: Record<string, string>
): {
  mcScore: number;
  maxScore: number;
  hasEssay: boolean;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  breakdown: Array<{
    questionId: string;
    number: number;
    type: string;
    studentAnswer: string;
    correctAnswer?: string;
    isCorrect: boolean;
    isPending: boolean;
    points: number;
    earnedPoints: number;
  }>;
} {
  let mcScore = 0;
  let maxScore = 0;
  let hasEssay = false;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const breakdown = questions.map(q => {
    maxScore += q.points;
    const studentAns = (answers[q.id] || '').trim();

    if (q.type === 'essay') {
      hasEssay = true;
      if (!studentAns) unansweredCount++;
      return {
        questionId: q.id,
        number: q.number,
        type: q.type,
        studentAnswer: studentAns,
        correctAnswer: q.explanation || 'Giáo viên chấm theo thang điểm',
        isCorrect: false,
        isPending: true,
        points: q.points,
        earnedPoints: 0
      };
    }

    if (!studentAns) {
      unansweredCount++;
      return {
        questionId: q.id,
        number: q.number,
        type: q.type,
        studentAnswer: '',
        correctAnswer: q.correctOptionId || '',
        isCorrect: false,
        isPending: false,
        points: q.points,
        earnedPoints: 0
      };
    }

    let isCorrect = false;
    if (q.type === 'multiple_choice') {
      isCorrect = studentAns === q.correctOptionId;
    } else if (q.type === 'true_false') {
      isCorrect = studentAns.toLowerCase() === (q.correctOptionId || '').toLowerCase();
    } else if (q.type === 'fill_blank') {
      // Case-insensitive, trimmed comparison
      isCorrect = studentAns.toLowerCase() === (q.correctOptionId || '').toLowerCase();
    }

    const earnedPoints = isCorrect ? q.points : 0;
    mcScore += earnedPoints;

    if (isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
    }

    return {
      questionId: q.id,
      number: q.number,
      type: q.type,
      studentAnswer: studentAns,
      correctAnswer: q.correctOptionId || '',
      isCorrect,
      isPending: false,
      points: q.points,
      earnedPoints
    };
  });

  // Round to 2 decimal places
  mcScore = Math.round(mcScore * 100) / 100;
  maxScore = Math.round(maxScore * 100) / 100;

  return {
    mcScore,
    maxScore,
    hasEssay,
    totalQuestions: questions.length,
    correctCount,
    wrongCount,
    unansweredCount,
    breakdown
  };
}
