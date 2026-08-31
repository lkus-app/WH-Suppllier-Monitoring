import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  Info,
  Plus,
  Search,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { DockType, Vehicle } from '../../types';
import { useApp } from '../../lib/store';
import { formatDuration } from '../../lib/utils';

export const VehicleMasterTab: React.FC = () => {
  const { vehicles, docks, updateVehicle, addVehicle, deleteVehicle, toggleVehicleStatus } = useApp();

  const [search, setSearch] = useState('');
  const [filterDockType, setFilterDockType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add / Edit Modal State
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formTonnage, setFormTonnage] = useState<number>(5);
  const [formAllowedDocks, setFormAllowedDocks] = useState<DockType[]>(['GENERAL']);
  const [formDesc, setFormDesc] = useState('');

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingVehicle(null);
    setFormName('');
    setFormCode('');
    setFormDuration(60);
    setFormTonnage(5);
    setFormAllowedDocks(['GENERAL']);
    setFormDesc('');
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setIsCreating(false);
    setFormName(v.vehicleName || v.name);
    setFormCode(v.code || '');
    setFormDuration(v.defaultDurationMinutes || v.durationMinutes || 60);
    setFormTonnage(v.maxTonnageCapacity || 10);
    setFormAllowedDocks(v.allowedDockTypes || ['GENERAL']);
    setFormDesc(v.description || '');
  };

  const handleToggleDockType = (type: DockType) => {
    if (formAllowedDocks.includes(type)) {
      if (formAllowedDocks.length > 1) {
        setFormAllowedDocks(formAllowedDocks.filter((t) => t !== type));
      }
    } else {
      setFormAllowedDocks([...formAllowedDocks, type]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      addVehicle({
        name: formName,
        vehicleName: formName,
        code: formCode.toUpperCase().trim(),
        durationMinutes: formDuration,
        defaultDurationMinutes: formDuration,
        maxTonnageCapacity: formTonnage,
        allowedDockTypes: formAllowedDocks,
        description: formDesc,
        isActive: true,
      });
      setIsCreating(false);
    } else if (editingVehicle) {
      updateVehicle({
        ...editingVehicle,
        name: formName,
        vehicleName: formName,
        code: formCode.toUpperCase().trim(),
        durationMinutes: formDuration,
        defaultDurationMinutes: formDuration,
        maxTonnageCapacity: formTonnage,
        allowedDockTypes: formAllowedDocks,
        description: formDesc,
      });
      setEditingVehicle(null);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      (v.vehicleName || v.name).toLowerCase().includes(search.toLowerCase()) ||
      (v.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.description || '').toLowerCase().includes(search.toLowerCase());

    const matchesDock =
      filterDockType === 'ALL' || (v.allowedDockTypes && v.allowedDockTypes.includes(filterDockType as DockType));

    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && v.isActive !== false) ||
      (filterStatus === 'INACTIVE' && v.isActive === false);

    return matchesSearch && matchesDock && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Master Tipe Armada & Standard Unloading Time (SOP)</h3>
              <p className="text-xs text-slate-400">
                Konfigurasi durasi terkunci bongkar muat per armada untuk mencegah tabrakan slot pada timeline
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tipe Armada</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari jenis armada, kode truk, atau SOP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1">Dock:</span>
            <select
              value={filterDockType}
              onChange={(e) => setFilterDockType(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL" className="bg-slate-900">Semua Tipe Dock</option>
              <option value="GENERAL" className="bg-slate-900">General (Kering)</option>
              <option value="LIQUID_ISOTANK" className="bg-slate-900">Liquid / Isotank</option>
              <option value="CONTAINER" className="bg-slate-900">Container</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 px-1">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL" className="bg-slate-900">Semua Status</option>
              <option value="ACTIVE" className="bg-slate-900">Aktif Saja</option>
              <option value="INACTIVE" className="bg-slate-900">Non-Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Kode</th>
                <th className="p-3.5">Tipe Armada</th>
                <th className="p-3.5">Standar Durasi Terkunci</th>
                <th className="p-3.5">Kapasitas Maksimal</th>
                <th className="p-3.5">Kompatibilitas Dock</th>
                <th className="p-3.5">Deskripsi & SOP</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada data armada yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const isActive = v.isActive !== false;
                  const duration = v.defaultDurationMinutes || v.durationMinutes || 60;
                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !isActive ? 'opacity-50 bg-slate-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-cyan-400">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                          {v.code || 'TRK'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{v.vehicleName || v.name}</div>
                        <div className="text-[10px] text-slate-400">ID: {v.id}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{duration} Menit</span>
                          <span className="text-[10px] text-amber-400/80 font-normal">
                            ({formatDuration(duration)})
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-200 font-mono">
                        {v.maxTonnageCapacity ? `${v.maxTonnageCapacity} Ton` : 'Sesuai Muatan'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(v.allowedDockTypes || ['GENERAL']).map((dockType) => (
                            <span
                              key={dockType}
                              className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {dockType}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">
                        {v.description || 'Standar operasional reguler pabrik'}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleVehicleStatus(v.id)}
                          className="cursor-pointer inline-flex items-center gap-1"
                          title={isActive ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
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
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                            title="Edit Master Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(v.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Hapus Armada"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <h4 className="font-bold text-sm text-white">Hapus Master Armada?</h4>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Menghapus armada ini akan menghilangkan pilihan armada pada form pembuatan booking slot oleh supplier.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteVehicle(deleteConfirmId);
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
      {(isCreating || editingVehicle) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">
                  {isCreating ? 'Tambah Master Tipe Armada' : `Edit: ${editingVehicle?.vehicleName}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingVehicle(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Nama Tipe Truk *</label>
                  <input
                    type="text"
                    placeholder="e.g. Wingbox 20 Ton"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Kode Singkat *</label>
                  <input
                    type="text"
                    placeholder="e.g. WB20"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-400 font-mono font-bold uppercase focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-amber-300 flex items-center justify-between">
                    <span>Durasi SOP Bongkar *</span>
                    <span className="font-mono">{formDuration} m</span>
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-lg text-amber-300 font-bold focus:outline-hidden"
                  >
                    <option value="30">30 Menit (0.5 Jam)</option>
                    <option value="45">45 Menit (0.75 Jam)</option>
                    <option value="60">60 Menit (1 Jam)</option>
                    <option value="90">90 Menit (1.5 Jam)</option>
                    <option value="120">120 Menit (2 Jam)</option>
                    <option value="150">150 Menit (2.5 Jam)</option>
                    <option value="180">180 Menit (3 Jam)</option>
                    <option value="240">240 Menit (4 Jam)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Kapasitas Tonase</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formTonnage}
                    onChange={(e) => setFormTonnage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Kompatibilitas Tipe Bay / Dock *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['GENERAL', 'LIQUID_ISOTANK', 'CONTAINER'] as DockType[]).map((dt) => {
                    const isChecked = formAllowedDocks.includes(dt);
                    return (
                      <button
                        type="button"
                        key={dt}
                        onClick={() => handleToggleDockType(dt)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[11px] truncate">{dt}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Deskripsi SOP & Muatan</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="e.g. Muatan palet bahan baku kimia, wajib safety shoes & helm"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2 text-[11px] text-blue-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Durasi yang Anda tetapkan akan langsung diterapkan pada mesin kalkulasi timeline ketersediaan slot.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingVehicle(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg"
                >
                  {isCreating ? 'Simpan Armada Baru' : 'Perbarui Armada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
