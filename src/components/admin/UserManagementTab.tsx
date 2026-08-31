import React, { useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  Edit2,
  KeyRound,
  LogIn,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { useApp } from '../../lib/store';
import { ROLE_CONFIGS } from '../../lib/authConfig';

export const UserManagementTab: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    setCurrentUser,
    switchRole,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('PURCHASING');
  const [formDept, setFormDept] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('PURCHASING');
    setFormDept('Procurement Division');
    setFormSupplier('');
    setFormPhone('0812-3456-7890');
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setIsCreating(false);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormDept(u.department || '');
    setFormSupplier(u.supplierName || '');
    setFormPhone(u.phoneNumber || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      addUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        department: formRole === 'SUPPLIER' ? undefined : formDept,
        supplierName: formRole === 'SUPPLIER' ? formSupplier : undefined,
        phoneNumber: formPhone,
        isActive: true,
      });
      setIsCreating(false);
    } else if (editingUser) {
      updateUser({
        ...editingUser,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        department: formRole === 'SUPPLIER' ? undefined : formDept,
        supplierName: formRole === 'SUPPLIER' ? formSupplier : undefined,
        phoneNumber: formPhone,
      });
      setEditingUser(null);
    }
  };

  const handleSwitchToUser = (u: User) => {
    setCurrentUser(u);
    switchRole(u.role);
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.department || '').toLowerCase().includes(term) ||
      (u.supplierName || '').toLowerCase().includes(term);

    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && u.isActive !== false) ||
      (filterStatus === 'INACTIVE' && u.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Manajemen Pengguna & Hak Akses (RBAC)</h3>
            <p className="text-xs text-slate-400">
              Pengelolaan 5 role kolaboratif pabrik: Admin, Purchasing, PPIC, Supplier/Vendor, dan Warehouse
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, email, departemen, atau PT Supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1">Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL" className="bg-slate-900">Semua Peran (5 Roles)</option>
              <option value="ADMIN" className="bg-slate-900">ADMIN (Super Admin)</option>
              <option value="PURCHASING" className="bg-slate-900">PURCHASING (Pengadaan)</option>
              <option value="PPIC" className="bg-slate-900">PPIC (Planning & Slot)</option>
              <option value="SUPPLIER" className="bg-slate-900">SUPPLIER (Vendor)</option>
              <option value="WAREHOUSE" className="bg-slate-900">WAREHOUSE (Gudang & Gate)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL" className="bg-slate-900">Semua Status</option>
              <option value="ACTIVE" className="bg-slate-900">Aktif</option>
              <option value="INACTIVE" className="bg-slate-900">Non-Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-3.5">Nama & Profil</th>
                <th className="p-3.5">Email & Kontak</th>
                <th className="p-3.5">Hak Akses (Role)</th>
                <th className="p-3.5">Departemen / Vendor</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.isActive !== false;
                  const isCurrent = u.id === currentUser.id;
                  const config = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.PURCHASING;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-purple-950/20' : !isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${config.colorScheme.badgeBg} ${config.colorScheme.badgeText} shrink-0`}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/30 text-purple-300 border border-purple-500/40">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300 font-mono">{u.email}</div>
                        {u.phoneNumber && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{u.phoneNumber}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${config.colorScheme.badgeBg} ${config.colorScheme.badgeText} ${config.colorScheme.border}`}
                        >
                          {config.badgeLabel}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {u.role === 'SUPPLIER' ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <Building className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{u.supplierName || 'PT Vendor'}</span>
                          </div>
                        ) : (
                          <div className="text-slate-300">{u.department || 'Internal Pabrik'}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className="cursor-pointer"
                          title="Klik untuk ubah status aktif/non-aktif"
                        >
                          {isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Non-Aktif
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {!isCurrent && (
                            <button
                              onClick={() => handleSwitchToUser(u)}
                              className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-purple-900/40 text-purple-300 hover:text-purple-200 border border-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                              title="Login instan sebagai user ini"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Login Demo</span>
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800"
                            title="Edit Profil"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Hapus Akun Pengguna?</h4>
                <p className="text-xs text-slate-400">Akun ini tidak akan dapat login lagi ke sistem.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteUser(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isCreating || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">
                  {isCreating ? 'Tambah Akun Pengguna Baru' : `Edit: ${editingUser?.name}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingUser(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="e.g. Ir. Bambang Trihatmodjo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Email Login *</label>
                  <input
                    type="email"
                    placeholder="nama@pabrik.co.id"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-purple-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-purple-300">Peran & Hak Akses (Role) *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-purple-500/50 rounded-lg text-purple-300 font-bold focus:outline-hidden"
                >
                  <option value="PURCHASING">PURCHASING (Membuat PO & Request Kedatangan)</option>
                  <option value="PPIC">PPIC (Approval PO & Window ETA)</option>
                  <option value="SUPPLIER">SUPPLIER (Booking Jadwal Slot Dock)</option>
                  <option value="WAREHOUSE">WAREHOUSE (Check-in Gate & Realisasi Bongkar)</option>
                  <option value="ADMIN">ADMIN (Super Admin Master Data & Settings)</option>
                </select>
              </div>

              {formRole === 'SUPPLIER' ? (
                <div className="space-y-1">
                  <label className="font-semibold text-emerald-400">Nama Perusahaan Vendor / Supplier *</label>
                  <input
                    type="text"
                    placeholder="e.g. PT Kimia Farma Logistik"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-lg text-white focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Divisi / Departemen Internal *</label>
                  <input
                    type="text"
                    placeholder="e.g. Plant Receiving Division"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-hidden"
                    required
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg"
                >
                  {isCreating ? 'Daftarkan Pengguna' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
