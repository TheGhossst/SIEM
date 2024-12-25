import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore'

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved';
  timestamp: Timestamp;
}

export async function getAlerts(status: 'active' | 'resolved'): Promise<Alert[]> {
  const alertsRef = collection(db, 'alerts')
  const q = query(
    alertsRef,
    where('status', '==', status),
    orderBy('timestamp', 'asc'),
    orderBy('__name__', 'asc'),
    limit(100)
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Alert))
}

export async function addAlert(alertData: Omit<Alert, 'id' | 'timestamp'>) {
  const alertsRef = collection(db, 'alerts')
  const docRef = await addDoc(alertsRef, {
    ...alertData,
    timestamp: Timestamp.now(),
  })
  return docRef.id
}

export async function updateAlertStatus(alertId: string, status: 'active' | 'resolved') {
  const alertRef = doc(db, 'alerts', alertId)
  await updateDoc(alertRef, { status })
}
