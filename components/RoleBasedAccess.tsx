'use client'

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RoleBasedAccessProps {
  allowedRoles: ('admin' | 'analyst' | 'viewer')[];
  children: React.ReactNode;
}

export function RoleBasedAccess({ allowedRoles, children }: RoleBasedAccessProps) {
  const { user } = useAuth();

  if (user && user.role && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return null;
}
