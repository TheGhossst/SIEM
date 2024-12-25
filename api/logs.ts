import { 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  Timestamp, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  setDoc 
} from 'firebase/firestore';
import { getLogCollectionRef, getSummaryCollectionRef } from '@/lib/firebase';

interface Log {
  id: string;
  source: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Timestamp;
}

// Fetch logs based on date range and optional severity
export async function getLogs(
  startDate: Date,
  endDate: Date,
  severity?: string
): Promise<Log[]> {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  const logQueries: Promise<Log[]>[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? startMonth : 1;
    const monthEnd = year === endYear ? endMonth : 12;

    for (let month = monthStart; month <= monthEnd; month++) {
      const logsRef = getLogCollectionRef(year, month);

      let q = query(
        logsRef,
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      if (severity && severity !== 'all') {
        q = query(q, where('severity', '==', severity));
      }

      logQueries.push(
        getDocs(q).then((querySnapshot) =>
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Log))
        )
      );
    }
  }

  // Run all queries in parallel and consolidate results
  const results = await Promise.all(logQueries);
  return results.flat();
}

// Add a new log to Firestore
export async function addLog(logData: Omit<Log, 'id' | 'timestamp'>) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const logsRef = getLogCollectionRef(year, month);
  
  const docRef = await addDoc(logsRef, {
    ...logData,
    timestamp: Timestamp.fromDate(now),
  });

  // Update summary
  await updateSummary(now, logData.severity);

  return docRef.id;
}

// Update the summary document for log counts
async function updateSummary(date: Date, severity: 'info' | 'warning' | 'critical') {
  const summaryRef = doc(getSummaryCollectionRef(), date.toISOString().split('T')[0]);
  const summaryDoc = await getDoc(summaryRef);

  if (summaryDoc.exists()) {
    await updateDoc(summaryRef, {
      [`${severity}_count`]: increment(1),
    });
  } else {
    await setDoc(summaryRef, {
      date: date.toISOString().split('T')[0],
      critical_count: severity === 'critical' ? 1 : 0,
      warning_count: severity === 'warning' ? 1 : 0,
      info_count: severity === 'info' ? 1 : 0,
    });
  }
}