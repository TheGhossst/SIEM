import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, addDoc } from 'firebase/firestore'

export async function getEvents(startDate: Date, endDate: Date, source?: string) {
  const eventsRef = collection(db, 'events')
  let q = query(eventsRef, 
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    orderBy('timestamp', 'desc'),
    limit(1000)
  )

  if (source) {
    q = query(q, where('source', '==', source))
  }

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function addEvent(eventData: any) {
  const eventsRef = collection(db, 'events')
  const docRef = await addDoc(eventsRef, {
    ...eventData,
    timestamp: new Date()
  })
  return docRef.id
}

