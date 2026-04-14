'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, User } from 'lucide-react';

interface User {
  id: string;
  name: string;
  squad_id: number;
  batch: number;
}

interface UserSearchProps {
  onSelect: (user: User) => void;
  selectedUser: User | null;
}

export function UserSearch({ onSelect, selectedUser }: UserSearchProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.squad_id.toString().includes(query) ||
      user.batch.toString().includes(query)
    );
  });

  const handleSelectUser = (user: User) => {
    onSelect(user);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearUser = () => {
    onSelect(null);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-cyan-500 rounded-full animate-spin"></div>
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-red-700 text-sm">
          Unable to load users. Please check database connection.
        </p>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected User Display or Search Input */}
      {selectedUser && !isOpen ? (
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2">
          <User className="w-4 h-4 text-gray-500" />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">{selectedUser.name}</div>
            <div className="text-xs text-gray-500">
              Squad {selectedUser.squad_id} • Batch {selectedUser.batch}
            </div>
          </div>
          <button
            onClick={handleClearUser}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search users by name, squad, or batch..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
          />
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {filteredUsers.length > 0 ? (
            <div className="py-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Squad {user.squad_id} • Batch {user.batch}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}