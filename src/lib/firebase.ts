import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  ClassInfo, 
  Matrix, 
  Exam, 
  Assignment, 
  Submission, 
  TeacherSetting 
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const app = initializeApp(firebaseConfig);
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-finaledunexaaigi-bbb29e00-934d-4d73-ae40-90ea363473e6';
export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper timeout wrapper to prevent indefinite hanging when offline or network issues occur
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Test connection on boot with strict 1.5s timeout
export async function testConnection(timeoutMs = 1500): Promise<boolean> {
  try {
    const check = getDocFromServer(doc(db, 'test', 'connection'))
      .then(() => true)
      .catch((error) => {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn('Firestore offline / check configuration');
        }
        return false;
      });
    return await withTimeout(check, timeoutMs, false);
  } catch {
    return false;
  }
}

// Auth Helper with strict 2s timeout
export async function ensureTeacherAuth(timeoutMs = 2000): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  
  const fallbackTeacher: User = {
    uid: 'teacher_default_edunexa',
    email: 'giaovien@edunexa.edu.vn',
    displayName: 'Thầy/Cô Nguyễn Văn An',
    isAnonymous: true,
    emailVerified: true
  } as unknown as User;

  try {
    const authPromise = signInAnonymously(auth)
      .then(cred => cred.user)
      .catch(() => fallbackTeacher);
    return await withTimeout(authPromise, timeoutMs, fallbackTeacher);
  } catch {
    return fallbackTeacher;
  }
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-closed-by-user' || 
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/popup-blocked' ||
      err?.message?.includes('popup-closed-by-user') ||
      err?.message?.includes('popup-blocked')
    ) {
      console.info('Google sign-in popup was closed by user or blocked.');
    } else {
      console.warn('Google sign in notice:', err?.message || err);
    }
    return null;
  }
}

export async function logoutTeacher(): Promise<void> {
  await signOut(auth);
}

// --- FIRESTORE SERVICES WITH RESILIENT FALLBACKS ---

// 1. Classes
export async function fetchClasses(teacherId: string): Promise<ClassInfo[]> {
  const path = 'classes';
  try {
    const q = query(collection(db, path), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    const list: ClassInfo[] = [];
    snap.forEach(d => list.push(d.data() as ClassInfo));
    return list;
  } catch (err: any) {
    console.warn(`Fetch classes offline/notice for ${path}:`, err.message);
    return [];
  }
}

export async function saveClass(cls: ClassInfo): Promise<void> {
  const path = `classes/${cls.id}`;
  try {
    await setDoc(doc(db, 'classes', cls.id), cls);
  } catch (err: any) {
    console.warn(`Save class notice for ${path}:`, err.message);
  }
}

export async function deleteClass(classId: string): Promise<void> {
  const path = `classes/${classId}`;
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (err: any) {
    console.warn(`Delete class notice for ${path}:`, err.message);
  }
}

// 2. Matrices
export async function fetchMatrices(teacherId: string): Promise<Matrix[]> {
  const path = 'matrices';
  try {
    const q = query(collection(db, path), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    const list: Matrix[] = [];
    snap.forEach(d => list.push(d.data() as Matrix));
    return list;
  } catch (err: any) {
    console.warn(`Fetch matrices notice for ${path}:`, err.message);
    return [];
  }
}

export async function saveMatrix(matrix: Matrix): Promise<void> {
  const path = `matrices/${matrix.id}`;
  try {
    await setDoc(doc(db, 'matrices', matrix.id), matrix);
  } catch (err: any) {
    console.warn(`Save matrix notice for ${path}:`, err.message);
  }
}

export async function deleteMatrix(matrixId: string): Promise<void> {
  const path = `matrices/${matrixId}`;
  try {
    await deleteDoc(doc(db, 'matrices', matrixId));
  } catch (err: any) {
    console.warn(`Delete matrix notice for ${path}:`, err.message);
  }
}

// 3. Exams
export async function fetchExams(teacherId: string): Promise<Exam[]> {
  const path = 'exams';
  try {
    const q = query(collection(db, path), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    const list: Exam[] = [];
    snap.forEach(d => list.push(d.data() as Exam));
    return list;
  } catch (err: any) {
    console.warn(`Fetch exams notice for ${path}:`, err.message);
    return [];
  }
}

export async function saveExam(exam: Exam): Promise<void> {
  const path = `exams/${exam.id}`;
  try {
    await setDoc(doc(db, 'exams', exam.id), exam);
  } catch (err: any) {
    console.warn(`Save exam notice for ${path}:`, err.message);
  }
}

export async function deleteExam(examId: string): Promise<void> {
  const path = `exams/${examId}`;
  try {
    await deleteDoc(doc(db, 'exams', examId));
  } catch (err: any) {
    console.warn(`Delete exam notice for ${path}:`, err.message);
  }
}

// 4. Assignments
export async function fetchAssignments(teacherId: string): Promise<Assignment[]> {
  const path = 'assignments';
  try {
    const q = query(collection(db, path), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    const list: Assignment[] = [];
    snap.forEach(d => list.push(d.data() as Assignment));
    return list;
  } catch (err: any) {
    console.warn(`Fetch assignments notice for ${path}:`, err.message);
    return [];
  }
}

export async function getAssignmentById(assignmentId: string): Promise<Assignment | null> {
  const path = `assignments/${assignmentId}`;
  try {
    const snap = await getDoc(doc(db, 'assignments', assignmentId));
    if (!snap.exists()) return null;
    return snap.data() as Assignment;
  } catch (err: any) {
    console.warn(`Get assignment notice for ${path}:`, err.message);
    return null;
  }
}

export async function saveAssignment(assignment: Assignment): Promise<void> {
  const path = `assignments/${assignment.id}`;
  try {
    await setDoc(doc(db, 'assignments', assignment.id), assignment);
  } catch (err: any) {
    console.warn(`Save assignment notice for ${path}:`, err.message);
  }
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const path = `assignments/${assignmentId}`;
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (err: any) {
    console.warn(`Delete assignment notice for ${path}:`, err.message);
  }
}

// 5. Submissions
export async function fetchSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
  const path = 'submissions';
  try {
    const q = query(collection(db, path), where('assignmentId', '==', assignmentId));
    const snap = await getDocs(q);
    const list: Submission[] = [];
    snap.forEach(d => list.push(d.data() as Submission));
    return list;
  } catch (err: any) {
    console.warn(`Fetch submissions notice for ${path}:`, err.message);
    return [];
  }
}

export async function fetchAllSubmissions(): Promise<Submission[]> {
  const path = 'submissions';
  try {
    const snap = await getDocs(collection(db, path));
    const list: Submission[] = [];
    snap.forEach(d => list.push(d.data() as Submission));
    return list;
  } catch (err: any) {
    console.warn(`Fetch all submissions notice for ${path}:`, err.message);
    return [];
  }
}

export async function fetchSubmissionById(submissionId: string): Promise<Submission | null> {
  const path = `submissions/${submissionId}`;
  try {
    const snap = await getDoc(doc(db, 'submissions', submissionId));
    if (!snap.exists()) return null;
    return snap.data() as Submission;
  } catch (err: any) {
    console.warn(`Fetch submission by id notice for ${path}:`, err.message);
    return null;
  }
}

export async function submitStudentExam(sub: Submission): Promise<void> {
  const path = `submissions/${sub.id}`;
  try {
    await setDoc(doc(db, 'submissions', sub.id), sub);
  } catch (err: any) {
    console.warn(`Submit student exam notice for ${path}:`, err.message);
  }
}

export async function updateSubmissionGrading(
  submissionId: string, 
  essayScore: number, 
  totalScore: number, 
  teacherFeedback: string,
  teacherName: string
): Promise<void> {
  const path = `submissions/${submissionId}`;
  try {
    await updateDoc(doc(db, 'submissions', submissionId), {
      essayScore,
      totalScore,
      teacherFeedback,
      status: 'graded',
      gradedBy: teacherName
    });
  } catch (err: any) {
    console.warn(`Update submission grading notice for ${path}:`, err.message);
  }
}

// 6. Teacher Settings
export async function getTeacherSetting(teacherId: string): Promise<TeacherSetting | null> {
  const path = `teacher_settings/${teacherId}`;
  try {
    const snap = await getDoc(doc(db, 'teacher_settings', teacherId));
    if (!snap.exists()) return null;
    return snap.data() as TeacherSetting;
  } catch (err: any) {
    console.warn(`Get teacher setting notice for ${path}:`, err.message);
    return null;
  }
}

export async function saveTeacherSetting(setting: TeacherSetting): Promise<void> {
  const path = `teacher_settings/${setting.teacherId}`;
  try {
    await setDoc(doc(db, 'teacher_settings', setting.teacherId), setting);
  } catch (err: any) {
    console.warn(`Save teacher setting notice for ${path}:`, err.message);
  }
}

// 7. Textbook PDFs
export async function fetchTextbooks(): Promise<import('../types').TextbookPdf[]> {
  const path = 'textbooks';
  try {
    const snap = await getDocs(collection(db, path));
    const list: import('../types').TextbookPdf[] = [];
    snap.forEach(d => list.push(d.data() as import('../types').TextbookPdf));
    return list;
  } catch (err: any) {
    console.warn(`Fetch textbooks notice for ${path}:`, err.message);
    return [];
  }
}

export async function saveTextbook(book: import('../types').TextbookPdf): Promise<void> {
  const path = `textbooks/${book.id}`;
  try {
    await setDoc(doc(db, 'textbooks', book.id), book);
  } catch (err: any) {
    console.warn(`Save textbook notice for ${path}:`, err.message);
  }
}

export async function deleteTextbook(bookId: string): Promise<void> {
  const path = `textbooks/${bookId}`;
  try {
    await deleteDoc(doc(db, 'textbooks', bookId));
  } catch (err: any) {
    console.warn(`Delete textbook notice for ${path}:`, err.message);
  }
}
