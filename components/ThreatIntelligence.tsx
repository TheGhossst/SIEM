'use client'

import { useState, useEffect } from 'react'
import { addThreatIndicator, getThreatIndicators, updateThreatIndicator } from '@/api/threatIntelligence'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'file_hash';
  value: string;
  confidence: 'low' | 'medium' | 'high';
  verified: boolean;
}

export default function ThreatIntelligence() {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([])
  const [newIndicator, setNewIndicator] = useState<Omit<ThreatIndicator, 'id' | 'verified'>>({
    type: 'ip',
    value: '',
    confidence: 'medium'
  })

  useEffect(() => {
    fetchIndicators()
  }, [])

  const fetchIndicators = async () => {
    const fetchedIndicators = await getThreatIndicators()
    setIndicators(fetchedIndicators)
  }

  const handleAddIndicator = async (e: React.FormEvent) => {
    e.preventDefault()
    await addThreatIndicator(newIndicator)
    setNewIndicator({ type: 'ip', value: '', confidence: 'medium' })
    fetchIndicators()
  }

  const handleVerify = async (id: string) => {
    await updateThreatIndicator(id, { verified: true })
    fetchIndicators()
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold mb-4">Threat Intelligence Management</h2>
      <form onSubmit={handleAddIndicator} className="mb-6 flex space-x-4">
        <Select
          value={newIndicator.type}
          onValueChange={(value: ThreatIndicator['type']) => setNewIndicator({ ...newIndicator, type: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ip">IP Address</SelectItem>
            <SelectItem value="domain">Domain</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="file_hash">File Hash</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={newIndicator.value}
          onChange={(e) => setNewIndicator({ ...newIndicator, value: e.target.value })}
          placeholder="Indicator value"
          className="flex-grow"
        />
        <Select
          value={newIndicator.confidence}
          onValueChange={(value: ThreatIndicator['confidence']) => setNewIndicator({ ...newIndicator, confidence: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit">Add Indicator</Button>
      </form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicators.map((indicator) => (
            <TableRow key={indicator.id}>
              <TableCell>{indicator.type}</TableCell>
              <TableCell>{indicator.value}</TableCell>
              <TableCell>{indicator.confidence}</TableCell>
              <TableCell>{indicator.verified ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                {!indicator.verified && (
                  <Button onClick={() => handleVerify(indicator.id)}>Verify</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}