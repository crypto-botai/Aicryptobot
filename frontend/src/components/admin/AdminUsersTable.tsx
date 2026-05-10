'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export function AdminUsersTable() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users', search],
    queryFn: () => api.get(`/admin/users?search=${search}&limit=20`).then((r) => r.data),
  });

  const toggleUser = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/admin/users/${id}`, { active }),
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="input-field py-2 pl-9 text-xs"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-white/3" />
          ))}
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-1">
          {users?.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-slate-200">{user.username}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs', user.license?.status === 'active' ? 'text-emerald-400' : 'text-slate-500')}>
                  {user.license?.plan ?? 'No license'}
                </span>
                <span className={cn('badge-', user.role === 'admin' ? 'warning' : 'info',
                  user.role === 'admin' ? 'badge-warning' : 'badge-info'
                )}>
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
