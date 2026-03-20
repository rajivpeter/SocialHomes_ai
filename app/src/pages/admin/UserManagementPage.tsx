import { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Edit2, Trash2, MoreVertical, Shield,
  UserCheck, UserX, Upload, Download, Key, Clock, Mail, Filter, Loader2
} from 'lucide-react';
import { formatDate, getInitials } from '@/utils/format';
import { adminApi } from '@/services/api-client';
import ActionModal from '@/components/shared/ActionModal';
import type { ActionField } from '@/components/shared/ActionModal';
import type { Persona } from '@/types';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  persona: Persona;
  team: string;
  patch: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdDate: string;
}

const ROLES = [
  'Chief Operating Officer',
  'Head of Housing',
  'Area Manager',
  'Team Manager',
  'Housing Officer',
  'Senior Housing Officer',
  'Repairs Operative',
  'Income Officer',
  'Compliance Officer',
  'System Administrator',
];

const TEAMS = [
  'Southwark & Lewisham Team',
  'Lambeth & Wandsworth Team',
  'Greenwich & Bexley Team',
  'Central Operations',
  'Maintenance & Repairs',
  'Income & Arrears',
  'Compliance & Safety',
  'Senior Leadership',
];

const PERSONA_OPTIONS: { value: Persona; label: string }[] = [
  { value: 'coo', label: 'COO' },
  { value: 'head-of-service', label: 'Head of Service' },
  { value: 'manager', label: 'Manager' },
  { value: 'housing-officer', label: 'Housing Officer' },
  { value: 'operative', label: 'Operative' },
];

const CREATE_USER_FIELDS: ActionField[] = [
  { id: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith', required: true },
  { id: 'email', label: 'Email', type: 'text', placeholder: 'john.smith@rcha.org.uk', required: true },
  {
    id: 'role', label: 'Role', type: 'select', required: true,
    options: ROLES.map(r => ({ value: r, label: r })),
  },
  {
    id: 'persona', label: 'Persona', type: 'select', required: true,
    options: PERSONA_OPTIONS,
  },
  {
    id: 'team', label: 'Team', type: 'select', required: true,
    options: TEAMS.map(t => ({ value: t, label: t })),
  },
  { id: 'patch', label: 'Patch Allocation', type: 'text', placeholder: 'e.g. Oak Park & Elm Gardens' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  // Fetch users from API on mount
  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.users();
        if (!cancelled) {
          // Normalise API response — backend may return different field names
          const normalised: ManagedUser[] = (data ?? []).map((u: any) => ({
            id: u.id ?? u.uid ?? '',
            name: u.name ?? u.displayName ?? '',
            email: u.email ?? '',
            role: u.role ?? '',
            persona: u.persona ?? 'housing-officer',
            team: u.team ?? '',
            patch: u.patch ?? '',
            status: u.status ?? 'active',
            lastLogin: u.lastLogin ?? u.lastLoginAt ?? '',
            createdDate: u.createdDate ?? u.createdAt ?? '',
          }));
          setUsers(normalised);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load users');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  const handleCreateUser = async (values: Record<string, string>) => {
    const payload = {
      name: values.name,
      email: values.email,
      role: values.role,
      persona: values.persona,
      team: values.team,
      patch: values.patch || '',
    };
    const created = await adminApi.createUser(payload);
    // Add the newly created user to local state
    const newUser: ManagedUser = {
      id: created.id ?? `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      persona: payload.persona as Persona,
      team: payload.team,
      patch: payload.patch,
      status: 'active',
      lastLogin: '',
      createdDate: created.createdAt ?? new Date().toISOString(),
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended' as const } : u));
    setShowActions(null);
  };

  const handleActivateUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' as const } : u));
    setShowActions(null);
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const statusColors: Record<string, string> = {
    active: 'bg-status-compliant/15 text-status-compliant',
    inactive: 'bg-status-void/15 text-status-void',
    suspended: 'bg-status-critical/15 text-status-critical',
  };

  const activeCount = users.filter(u => u.status === 'active').length;
  const inactiveCount = users.filter(u => u.status !== 'active').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-peach">User Management</h1>
          <p className="text-sm text-text-muted mt-1">{users.length} users &bull; {activeCount} active &bull; {inactiveCount} inactive/suspended</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-surface-card border border-border-default rounded-lg text-xs text-text-muted hover:text-text-primary transition-all">
            <Upload size={13} /> Import CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-surface-card border border-border-default rounded-lg text-xs text-text-muted hover:text-text-primary transition-all">
            <Download size={13} /> Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-teal text-white rounded-lg text-xs font-medium hover:bg-brand-teal/90 transition-all"
          >
            <Plus size={13} /> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-surface-card border border-border-default rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-surface-card border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-surface-card border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={24} className="animate-spin text-brand-teal mr-3" />
          <span className="text-sm text-text-muted">Loading users...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-status-critical/10 border border-status-critical/20 rounded-xl p-6 text-center">
          <p className="text-sm text-status-critical mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-brand-teal hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left p-3 text-text-muted">User</th>
                <th className="text-left p-3 text-text-muted">Role</th>
                <th className="text-left p-3 text-text-muted">Team</th>
                <th className="text-left p-3 text-text-muted">Patch</th>
                <th className="text-left p-3 text-text-muted">Status</th>
                <th className="text-left p-3 text-text-muted">Last Login</th>
                <th className="text-right p-3 text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-border-subtle hover:bg-surface-hover/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal/30 to-brand-deep/30 flex items-center justify-center text-brand-teal text-xs font-bold ring-1 ring-brand-teal/20">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{user.name}</div>
                        <div className="text-[10px] text-text-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-text-secondary">{user.role}</td>
                  <td className="p-3 text-xs text-text-secondary">{user.team}</td>
                  <td className="p-3 text-xs text-text-secondary">{user.patch}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-text-muted">{user.lastLogin}</td>
                  <td className="p-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setShowActions(showActions === user.id ? null : user.id)}
                        className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {showActions === user.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowActions(null)} />
                          <div className="absolute right-0 top-8 w-48 glass-card-elevated rounded-xl shadow-2xl z-50 animate-slide-in-down py-1">
                            <button className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors" onClick={() => { setSelectedUser(user); setShowActions(null); }}>
                              <Edit2 size={12} /> Edit User
                            </button>
                            <button className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors" onClick={() => setShowActions(null)}>
                              <Shield size={12} /> Change Role
                            </button>
                            <button className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors" onClick={() => setShowActions(null)}>
                              <Key size={12} /> Reset Password
                            </button>
                            {user.status === 'active' ? (
                              <button
                                className="w-full text-left px-3 py-2 text-xs text-status-warning hover:bg-surface-hover flex items-center gap-2 transition-colors"
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                <UserX size={12} /> Suspend
                              </button>
                            ) : (
                              <button
                                className="w-full text-left px-3 py-2 text-xs text-status-compliant hover:bg-surface-hover flex items-center gap-2 transition-colors"
                                onClick={() => handleActivateUser(user.id)}
                              >
                                <UserCheck size={12} /> Activate
                              </button>
                            )}
                            <div className="my-1 border-t border-border-default" />
                            <button className="w-full text-left px-3 py-2 text-xs text-status-critical hover:bg-surface-hover flex items-center gap-2 transition-colors" onClick={() => setShowActions(null)}>
                              <Trash2 size={12} /> Delete User
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center">
              <Users size={32} className="text-text-muted mx-auto mb-2 opacity-30" />
              <p className="text-sm text-text-muted">No users match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal — uses ActionModal with real API call */}
      <ActionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New User"
        description="Create a new user account and assign a role"
        icon={<Plus size={20} className="text-brand-teal" />}
        fields={CREATE_USER_FIELDS}
        submitLabel="Create User"
        onSubmit={handleCreateUser}
      />
    </div>
  );
}
