'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  name: string;
  squad_id: number;
  batch: number;
}

interface UserSelectorProps {
  onSelect: (user: User) => void;
  selectedUser: User | null;
}

export function UserSelector({ onSelect, selectedUser }: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        
        if (res.ok) {
          setUsers(data.users || []);
        } else {
          console.error('API Error:', data.error);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p className="text-gray-500 text-sm">Loading users...</p>;

  if (users.length === 0) {
    return (
      <div className="w-full max-w-xs">
        <label className="text-sm font-semibold text-gray-700 mb-2 block">Select User</label>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">
            Unable to load users. Please check database connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs">
      <label className="text-sm font-semibold text-gray-700 mb-2 block">Select User</label>
      <Select
        value={selectedUser?.id || ''}
        onValueChange={(id) => {
          const user = users.find((u) => u.id === id);
          if (user) onSelect(user);
        }}
      >
        <SelectTrigger className="bg-white">
          <SelectValue 
            placeholder="Choose a user..." 
          >
            {selectedUser ? `${selectedUser.name} (Squad ${selectedUser.squad_id}, Batch ${selectedUser.batch})` : "Choose a user..."}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} (Squad {user.squad_id}, Batch {user.batch})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
