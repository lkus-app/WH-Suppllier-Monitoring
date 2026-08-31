import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export type Column<T> = ColumnDef<T>;

interface FilterOption {
  label: string;
  value: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor?: (item: T) => string | number;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filterKey?: keyof T;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  pageSizeDefault?: number;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onExportCsv?: () => void;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Cari data...',
  searchKeys = [],
  filterKey,
  filterOptions = [],
  filterLabel = 'Status',
  pageSizeDefault = 8,
  emptyMessage = 'Tidak ada data yang ditemukan.',
  title,
  subtitle,
  actions,
  onExportCsv,
  isLoading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Dropdown Filter
      if (filterKey && selectedFilter !== 'ALL') {
        const itemVal = String(item[filterKey] || '').toUpperCase();
        if (itemVal !== selectedFilter.toUpperCase()) {
          return false;
        }
      }

      // 2. Search Box
      if (search.trim()) {
        const query = search.toLowerCase();
        if (searchKeys.length > 0) {
          const match = searchKeys.some((k) =>
            String(item[k] || '')
              .toLowerCase()
              .includes(query)
          );
          if (!match) return false;
        } else {
          // Check all string/number values in item
          const match = Object.values(item).some((val) =>
            String(val || '')
              .toLowerCase()
              .includes(query)
          );
          if (!match) return false;
        }
      }

      return true;
    });
  }, [data, search, selectedFilter, filterKey, searchKeys]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      return sortDirection === 'asc' ? 1 : -1;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-xl overflow-hidden flex flex-col">
      {/* Table Header Section */}
      {(title || subtitle || actions) && (
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Filter and Search Bar Controls */}
      <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          {filterOptions.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs cursor-pointer"
              >
                <option value="ALL">Semua {filterLabel}</option>
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Optional CSV Export */}
        {onExportCsv && (
          <button
            onClick={onExportCsv}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        )}
      </div>

      {/* Table Content (Shadcn UI Table structure) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && handleSort(col.accessorKey)}
                  className={`px-4 py-3.5 select-none ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer hover:text-slate-900 hover:bg-slate-100/80 transition-colors' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                  <p className="font-medium text-slate-600">{emptyMessage}</p>
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="mt-2 text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Hapus pencarian
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={keyExtractor ? keyExtractor(row) : rowIndex}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-4 py-3.5 text-slate-700 ${col.className || ''}`}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '-')
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            Menampilkan{' '}
            <strong className="text-slate-900">
              {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-900">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </strong>{' '}
            dari <strong className="text-slate-900">{filteredData.length}</strong> data
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="ml-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:outline-hidden"
          >
            <option value={5}>5 / hal</option>
            <option value={8}>8 / hal</option>
            <option value={15}>15 / hal</option>
            <option value={25}>25 / hal</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
            title="Halaman Pertama"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
            title="Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-3 py-1 font-semibold text-slate-900">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
            title="Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
            title="Halaman Terakhir"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
