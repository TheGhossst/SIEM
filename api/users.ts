import { db, auth } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export async function createUser(user: User) {
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    email: user.email,
    role: 'viewer', // Default role
  });
}

export async function getUserRole(uid: string) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data().role;
  }
  return null;
}

export async function updateUserRole(uid: string, role: 'admin' | 'analyst' | 'viewer') {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { role });
}

