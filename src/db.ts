import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { ChatSession } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export const syncSessionToFirestore = async (userId: string, session: ChatSession) => {
  const path = `users/${userId}/sessions/${session.id}`;
  try {
    const cleanSession = JSON.parse(JSON.stringify(session));
    await setDoc(doc(db, path), cleanSession);
  } catch (error) {
    console.error('Firestore sync error:', error);
  }
};

export const deleteSessionFromFirestore = async (userId: string, sessionId: string) => {
  const path = `users/${userId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    console.error('Firestore delete error:', error);
  }
};

export const fetchSessionsFromFirestore = async (userId: string): Promise<ChatSession[]> => {
  const path = `users/${userId}/sessions`;
  try {
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const sessions: ChatSession[] = [];
    snapshot.forEach(doc => {
      sessions.push(doc.data() as ChatSession);
    });
    return sessions;
  } catch (error) {
    console.error('Firestore fetch error:', error);
    return [];
  }
};
