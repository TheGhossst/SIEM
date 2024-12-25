'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAlerts, updateAlertStatus } from '@/api/alerts';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved';
  timestamp: { toDate: () => Date };
}

export default function AlertSystem() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState<'active' | 'resolved'>('active');

  const fetchAlerts = useCallback(async () => {
    const fetchedAlerts = await getAlerts(status);
    setAlerts(fetchedAlerts.reverse());
  }, [status]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolve = async (alertId: string) => {
    await updateAlertStatus(alertId, 'resolved');
    fetchAlerts();
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <Select
          value={status}
          onValueChange={(value: 'active' | 'resolved') => setStatus(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Alerts</SelectItem>
            <SelectItem value="resolved">Resolved Alerts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold">{alert.title}</h2>
                <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                  {alert.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{alert.description}</p>
              <p className="text-sm text-gray-400 mt-2">
                {alert.timestamp.toDate().toLocaleString()}
              </p>
            </CardContent>
            {status === 'active' && (
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => handleResolve(alert.id)}
                >
                  Resolve Alert
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}