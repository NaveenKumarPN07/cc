import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, UserX } from 'lucide-react';
import { userAPI } from '../../services/api';
import { Spinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search }],
    queryFn: () => userAPI.getAll({ search: search || undefined, limit: 30 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userAPI.update(id, data),
    onSuccess: () => {
      toast.success('User updated');
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => userAPI.delete(id),
    onSuccess: () => {
      toast.success('User deactivated');
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-xl font-bold">Users ({data?.total || 0})</h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9 max-w-sm"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.users?.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center
                                         justify-center text-sm font-bold uppercase">
                          {user.name?.[0]}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={user.role}
                        onChange={(e) => updateMutation.mutate({ id: user._id, data: { role: e.target.value } })}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${user.isActive
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-500'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: user._id, data: { role: user.role === 'admin' ? 'user' : 'admin' } })}
                          className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg"
                          title="Toggle admin"
                        >
                          <Shield size={15} />
                        </button>
                        {user.isActive && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Deactivate ${user.name}?`)) deleteMutation.mutate(user._id);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Deactivate user"
                          >
                            <UserX size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
