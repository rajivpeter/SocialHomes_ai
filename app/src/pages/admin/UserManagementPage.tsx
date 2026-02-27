import { useState } from 'react';
import {
  Users, Plus, Search, Edit2, Trash2, MoreVertical, Shield,
  UserCheck, UserX, Upload, Download, Key, Clock, Mail, Filter
} from 'lucide-react';
import { formatDate, getInitials } from '@/utils/format';
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

const mockUsers: ManagedUser[] = [
  { id: 'u-001', name: 'Helen Bradshaw', email: 'helen.bradshaw@rcha.org.uk', role: 'Chief Operating Officer', persona: 'coo', team: 'Senior Leadership', patch: 'All areas', status: 'active', lastLogin: '2026-02-27', createdDate: '2024-06-15' },
  { id: 'u-002', name: 'Marcus Thompson', email: 'marcus.thompson@rcha.org.uk', role: 'Head of Housing', persona: 'head-of-service', team: 'Central Operations', patch: 'South London', status: 'active', lastLogin: '2026-02-27', createdDate: '2024-07-01' },
  { id: 'u-003', name: 'Priya Sharma', email: 'priya.sharma@rcha.org.uk', role: 'Team Manager', persona: 'manager', team: 'Southwark & Lewisham Team', patch: 'Southwark', status: 'active', lastLogin: '2026-02-26', createdDate: '2024-08-15' },
  { id: 'u-004', name: 'Sarah Mitchell', email: 'sarah.mitchell@rcha.org.uk', role: 'Housing Officer', persona: 'housing-officer', team: 'Southwark & Lewisham Team', patch: 'Oak Park & Elm Gardens', status: 'active', lastLogin: '2026-02-27', createdDate: '2024-09-01' },
  { id: 'u-005', name: 'Mark Stevens', email: 'mark.stevens@rcha.org.uk', role: 'Repairs Operative', persona: 'operative', team: 'Maintenance & Repairs', patch: 'South London', status: 'active', lastLogin: '2026-02-27', createdDate: '2024-09-15' },
  { id: 'u-006', name: 'James Collins', email: 'james.collins@rcha.org.uk', role: 'Housing Officer', persona: 'housing-officer', team: 'Lambeth & Wandsworth Team', patch: 'Cedar Heights', status: 'active', lastLogin: '2026-02-25', createdDate: '2024-10-01' },
  { id: 'u-007', name: 'Amy Chen', email: 'amy.chen@rcha.org.uk', role: 'Income Officer', persona: 'housing-officer', team: 'Income & Arrears', patch: 'All areas', status: 'active', lastLogin: '2026-02-24', createdDate: '2024-10-15' },
  { id: 'u-008', name: 'David Okafor', email: 'david.okafor@rcha.org.uk', role: 'Compliance Officer', persona: 'housing-officer', team: 'Compliance & Safety', patch: 'All areas', status: 'active', lastLogin: '2026-02-27', createdDate: '2024-11-01' },
  { id: 'u-009', name: 'Rachel Green', email: 'rachel.green@rcha.org.uk', role: 'Senior Housing Officer', persona: 'housing-officer', team: 'Greenwich & Bexley Team', patch: 'Riverside & Meadow', status: 'inactive', lastLogin: '2026-01-15', createdDate: '2024-06-15' },
  { id: 'u-010', name: 'Tom Wilson', email: 'tom.wilson@rcha.org.uk', role: 'Repairs Operative', persona: 'operative', team: 'Maintenance & Repairs', patch: 'North London', status: 'suspended', lastLogin: '2026-02-01', createdDate: '2025-01-10' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

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
          <p className="text-sm text-text-muted mt-1">{users.length} users • {activeCount} active • {inactiveCount} inactive/suspended</p>
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

      {/* Users Table */}
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
                              onClick={() => { setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'suspended' } : u)); setShowActions(null); }}
                            >
                              <UserX size={12} /> Suspend
                            </button>
                          ) : (
                            <button
                              className="w-full text-left px-3 py-2 text-xs text-status-compliant hover:bg-surface-hover flex items-center gap-2 transition-colors"
                              onClick={() => { setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'active' } : u)); setShowActions(null); }}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowCreateModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] glass-card-elevated rounded-2xl shadow-2xl z-50 animate-fade-in-up">
            <div className="p-5 border-b border-border-default">
              <h2 className="text-lg font-heading font-bold text-text-primary">Add New User</h2>
              <p className="text-xs text-text-muted mt-1">Create a new user account and assign a role</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-1">First Name</label>
                  <input type="text" placeholder="John" className="w-full bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-1">Last Name</label>
                  <input type="text" placeholder="Smith" className="w-full bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-1">Email</label>
                <input type="email" placeholder="john.smith@rcha.org.uk" className="w-full bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-1">Role</label>
                <select className="w-full bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary">
                  <option value="">Select a role...</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-1">Team</label>
                <select className="w-full bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary">
                  <option value="">Select a team...</option>
                  {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-1">Patch Allocation</label>
                <input type="text" placeholder="e.g. Oak Park & Elm Gardens" className="w-full bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
              </div>
            </div>
            <div className="p-5 border-t border-border-default flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs text-text-muted hover:text-text-primary transition-colors">Cancel</button>
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-brand-teal text-white rounded-lg text-xs font-medium hover:bg-brand-teal/90 transition-all">Create User</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
