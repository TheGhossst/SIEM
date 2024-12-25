'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getThreatIndicators, updateThreatIndicator, reEncryptThreatIndicator } from '@/api/threatIntelligence'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Shield, ShieldAlert, RefreshCw } from 'lucide-react'

interface ThreatIndicator {
  id: string;
  type: string;
  value: string;
  confidence: 'low' | 'medium' | 'high';
  verified: boolean;
  status?: 'valid' | 'corrupted';
  lastValidation?: Date;
}

interface Threat {
  id: string;
  type: string;
  value: string;
  sourceIp: string;
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Timestamp;
  matchedIndicators: ThreatIndicator[];
}

export default function ThreatDetection() {
  const [threats, setThreats] = useState<Threat[]>([])
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const fetchedIndicators = await getThreatIndicators()
        setIndicators(fetchedIndicators)
        setError(null)
      } catch (error) {
        console.error('Error fetching threat indicators:', error)
        setError('Failed to fetch some threat indicators. Data may be incomplete.')
      } finally {
        setLoading(false)
      }
    }
    fetchIndicators()

    const q = query(collection(db, 'threats'), orderBy('timestamp', 'desc'), limit(10))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const threatsData: Threat[] = []
      querySnapshot.forEach((doc) => {
        const threatData = doc.data() as Omit<Threat, 'id' | 'matchedIndicators'>
        const matchedIndicators = indicators.filter(indicator =>
          indicator.type === threatData.type && indicator.value === threatData.value
        )
        threatsData.push({
          id: doc.id,
          ...threatData,
          matchedIndicators
        })
      })
      setThreats(threatsData)
    }, (error) => {
      console.error('Error fetching threats:', error)
      setError('Failed to fetch threats. Please try again later.')
    })

    return () => unsubscribe()
  }, [indicators])

  const handleMarkAsInvalid = async (id: string) => {
    setProcessing(prev => ({ ...prev, [id]: true }))
    try {
      await updateThreatIndicator(id, { status: 'corrupted' })
      const fetchedIndicators = await getThreatIndicators()
      setIndicators(fetchedIndicators)
      setError(null)
    } catch (error) {
      console.error('Error marking threat indicator as invalid:', error)
      setError('Failed to update threat indicator. Please try again.')
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleReEncryptIndicator = async (id: string) => {
    setProcessing(prev => ({ ...prev, [id]: true }))
    try {
      await reEncryptThreatIndicator(id)
      const fetchedIndicators = await getThreatIndicators()
      setIndicators(fetchedIndicators)
      setError(null)
    } catch (error) {
      console.error('Error re-encrypting threat indicator:', error)
      setError('Failed to re-encrypt threat indicator. Please try again.')
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }))
    }
  }

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Threat Detection</h2>
        <Badge variant="outline" className="px-3 py-1">
          {indicators.length} Indicators
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {threats.map((threat) => (
          <Card key={threat.id} className="overflow-hidden">
            <CardHeader className="space-y-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{threat.type}</CardTitle>
                <Badge className={getSeverityBadgeColor(threat.severity)}>
                  {threat.severity}
                </Badge>
              </div>
              <CardDescription>
                {threat.timestamp.toDate().toLocaleString()}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Source:</span> {threat.sourceIp}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Target:</span> {threat.target}
                </p>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                {threat.description}
              </p>

              {threat.matchedIndicators.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Matched Indicators
                  </h4>
                  <ul className="space-y-3">
                    {threat.matchedIndicators.map((matchedIndicator) => (
                      <li key={matchedIndicator.id} className="p-3 bg-secondary rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{matchedIndicator.type}</span>
                          <Badge className={getConfidenceBadgeColor(matchedIndicator.confidence)}>
                            {matchedIndicator.confidence}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-2">{matchedIndicator.value}</p>
                        
                        {matchedIndicator.status === 'corrupted' && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processing[matchedIndicator.id]}
                              onClick={() => handleMarkAsInvalid(matchedIndicator.id)}
                            >
                              {processing[matchedIndicator.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Mark Invalid'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={processing[matchedIndicator.id]}
                              onClick={() => handleReEncryptIndicator(matchedIndicator.id)}
                            >
                              {processing[matchedIndicator.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <RefreshCw className="h-4 w-4" />
                                  Re-encrypt
                                </div>
                              )}
                            </Button>
                          </div>
                        )}

                        {matchedIndicator.lastValidation && (
                          <div className="text-xs text-gray-500 mt-2">
                            Last validated: {matchedIndicator.lastValidation.toLocaleString()}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}