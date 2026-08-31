import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  HardHat,
  Info,
  Layers,
  Plus,
  Power,
  Search,
  Sliders,
  Trash2,
  Warehouse,
  Wrench,
  X,
} from 'lucide-react';
import { Dock, DockType } from '../../types';
import { useApp } from '../../lib/store';

export const DockMasterTab: React.FC = () => {
  const { docks, bookings, updateDock, addDock, deleteDock, toggleDockStatus } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Modal State
  const [editingDock, setEditingDock] = useState<Dock | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<DockType>('GENERAL');
  const [formMaxTonnage, setFormMaxTonnage] = useState<number>(30);
  const [formNotes, setFormNotes] = useState('');
  const [formFeatures, setFormFeatures] = useState<string[]>([
    'Hydraulic Dock Leveller',
    'Automatic Gate Lock',
  ]);

  const AVAILABLE_EQUIPMENT = [
    'Hydraulic Dock Leveller',
    'Automatic Gate Lock',
    'Chemical Piping Manifold',
    'High Pressure Centrifugal Pump',
    'Container Twist-Lock Bay',
    '5-Ton Overhead Crane Access',
    'Thermal Pallet Wrapper',
    'Hazardous Spill Containment Pit',
  ];

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingDock(null);
    setFormName(`Dock ${docks.length + 1}`);
    setFormType('GENERAL');
    setFormMaxTonnage(30);
    setFormNotes('Pintu operasional normal muatan reguler');
    setFormFeatures(['Hydraulic Dock Leveller', 'Automatic Gate Lock']);
  };

  const openEditModal = (d: Dock) => {
    setEditingDock(d);
    setIsCreating(false);
    setFormName(d.dockName || d.name);
    setFormType((d.dockType as DockType) || 'GENERAL');
    setFormMaxTonnage(d.maxTonnage || 25);
    setFormNotes(d.notes || '');
    setFormFeatures(d.features || ['Hydraulic Dock Leveller']);
  };

  const handleToggleEquipment = (eq: string) => {
    if (formFeatures.includes(eq)) {
      setFormFeatures(formFeatures.filter((item) => item !== eq));
    } else {
      setFormFeatures([...formFeatures, eq]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      addDock({
        name: formName,
        dockName: formName,
        dockType: formType,
        maxTonnage: formMaxTonnage,
        notes: formNotes,
        features: formFeatures,
        isActive: true,
      });
      setIsCreating(false);
    } else if (editingDock) {
      updateDock({
        ...editingDock,
        name: formName,
        dockName: formName,
        dockType: formType,
        maxTonnage: formMaxTonnage,
        notes: formNotes,
        features: formFeatures,
      });
      setEditingDock(null);
    }
  };

  const filteredDocks = docks.filter((d) => {
    const nameStr = (d.dockName || d.name).toLowerCase();
    const notesStr = (d.notes || '').toLowerCase();
    const matchesSearch = nameStr.includes(search.toLowerCase()) || notesStr.includes(search.toLowerCase());

    const matchesType = filterType === 'ALL' || d.dockType === filterType;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && d.isActive !== false) ||
      (filterStatus === 'MAINTENANCE' && d.isActive === false);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Master Pintu Dock & Loading Bays</h3>
            <p className="text-xs text-slate-400">
              Konfigurasi kapasitas leveller, tipe bay muatan, dan manajemen lockout maintenance pintu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pintu Dock</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama pintu dock atau catatan perlengkapan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1">Tipe:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL" className="bg-slate-900">Semua Tipe Bay</option>
              <option value="GENERAL" className="bg-slate-900">GENERAL (Kering/Palet)</option>
              <option value="LIQUID_ISOTANK" className="bg-slate-900">LIQUID_ISOTANK (Cairan/Tangki)</option>
              <option value="CONTAINER" className="bg-slate-900">CONTAINER (High Bay)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1">Kondisi:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL" className="bg-slate-900">Semua Kondisi</option>
              <option value="ACTIVE" className="bg-slate-900">Siap Operasional</option>
              <option value="MAINTENANCE" className="bg-slate-900">Maintenance / Standby</option>
            </select>
          </div>

          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                viewMode === 'GRID' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                viewMode === 'TABLE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: GRID or TABLE */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocks.map((d) => {
            const isActive = d.isActive !== false;
            const activeBookingsCount = bookings.filter(
              (b) => b.dockId === d.id && b.status !== 'CANCELLED' && b.status !== 'COMPLETED'
            ).length;

            let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            if (d.dockType === 'LIQUID_ISOTANK') {
              badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            } else if (d.dockType === 'CONTAINER') {
              badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            }

            return (
              <div
                key={d.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all shadow-xl flex flex-col justify-between ${
                  isActive
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-amber-500/30 bg-amber-950/10 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isActive ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <h4 className="font-black text-base text-white">{d.dockName || d.name}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border uppercase ${badgeColor}`}
                    >
                      {d.dockType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80">
                    <div className="text-slate-400">
                      Tonase Maks: <span className="text-white font-bold">{d.maxTonnage || 30} Ton</span>
                    </div>
                    <div className="text-slate-400 text-right">
                      Slot Hari Ini:{' '}
                      <span className="text-cyan-400 font-bold">{activeBookingsCount} Jadwal</span>
                    </div>
                  </div>

                  {/* Equipment Features Badges */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Fasilitas & Sensor Bay:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(d.features && d.features.length > 0
                        ? d.features
                        : ['Hydraulic Dock Leveller', 'SOP Standard']
                      ).map((feat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-slate-950 text-slate-300 border border-slate-800"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
                    {d.notes || 'Pintu operasional normal muatan reguler'}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => toggleDockStatus(d.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 hover:bg-amber-950/50 text-slate-300 hover:text-amber-400'
                        : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Lock Maintenance' : 'Aktifkan Bay'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(d)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Edit Konfigurasi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(d.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Hapus Pintu Dock"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3.5">Nama Dock</th>
                  <th className="p-3.5">Tipe Fasilitas</th>
                  <th className="p-3.5">Kapasitas Beban</th>
                  <th className="p-3.5">Perlengkapan Khusus</th>
                  <th className="p-3.5">Catatan Operasional</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocks.map((d) => {
                  const isActive = d.isActive !== false;
                  return (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white text-sm">{d.dockName || d.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {d.dockType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{d.maxTonnage || 25} Ton</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(d.features || []).map((f, i) => (
                            <span key={i} className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">{d.notes || '-'}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleDockStatus(d.id)}
                          className="cursor-pointer"
                          title="Klik untuk ubah status"
                        >
                          {isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Operasional
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Maintenance
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Hapus Pintu Dock?</h4>
                <p className="text-xs text-slate-400">Tindakan ini akan menonaktifkan pintu dari alur slot booking.</p>
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
                  deleteDock(deleteConfirmId);
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
      {(isCreating || editingDock) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Warehouse className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">
                  {isCreating ? 'Tambah Pintu Dock Baru' : `Edit: ${editingDock?.dockName}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingDock(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nama Pintu Dock / Bay *</label>
                <input
                  type="text"
                  placeholder="e.g. Dock 6 (High Bay)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Tipe Fasilitas Bay *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as DockType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden"
                  >
                    <option value="GENERAL">GENERAL (Muatan Kering/Palet)</option>
                    <option value="LIQUID_ISOTANK">LIQUID_ISOTANK (Piping Tangki Kimia)</option>
                    <option value="CONTAINER">CONTAINER (High Bay Kontainer)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Beban Max (Ton) *</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={formMaxTonnage}
                    onChange={(e) => setFormMaxTonnage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Fasilitas / Perlengkapan Khusus</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_EQUIPMENT.map((eq) => {
                    const isChecked = formFeatures.includes(eq);
                    return (
                      <button
                        type="button"
                        key={eq}
                        onClick={() => handleToggleEquipment(eq)}
                        className={`p-2 rounded-xl border text-left text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate mr-1">{eq}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Catatan Khusus Operasional</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Wajib operator forklift bersertifikat B3"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingDock(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg"
                >
                  {isCreating ? 'Simpan Pintu Dock' : 'Perbarui Pintu Dock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
