import React from 'react';
import { CheckCircle2, Download, Printer, QrCode, Shield, Truck, X } from 'lucide-react';
import { Booking } from '../../types';
import { formatDateIndo, formatDuration, formatTimeHM } from '../../lib/utils';

interface GatePassModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const GatePassModal: React.FC<GatePassModalProps> = ({ booking, onClose }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Controls */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 print:hidden">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Digital Delivery Gate Pass / Surat Jalan Masuk</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto bg-slate-900 text-slate-100 print:bg-white print:text-black">
          {/* Header */}
          <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white print:text-black">
                    PT PABRIK MANUFAKTUR UTAMA
                  </h2>
                  <p className="text-xs text-slate-400 print:text-gray-600">
                    Sistem Manajemen Slot Antrean Bongkar Muat (DockSlot)
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Surat Masuk Gerbang
              </span>
              <span className="font-mono text-sm font-bold text-blue-400 print:text-blue-700">
                {booking.bookingCode}
              </span>
            </div>
          </div>

          {/* QR & Key Info Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:bg-gray-100 print:border-gray-300">
            {/* Simulated QR Code */}
            <div className="p-3 bg-white rounded-xl shadow-md flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-950 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                <div className="grid grid-cols-4 gap-1 w-full h-full opacity-90">
                  <div className="bg-white rounded-xs"></div>
                  <div className="bg-white rounded-xs"></div>
                  <div className="bg-transparent"></div>
                  <div className="bg-white rounded-xs"></div>
                  <div className="bg-transparent"></div>
                  <div className="bg-white rounded-xs"></div>
                  <div className="bg-white rounded-xs"></div>
                  <div className="bg-transparent"></div>
                  <div className="bg-white rounded-xs"></div>
                  <div className="bg-transparent"></div>
                  <div className="bg-white rounded-xs"></div>
                  <div className="bg-white rounded-xs"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-white" />
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-900 mt-1 font-bold">SCAN DI POS SATPAM</span>
            </div>

            {/* Target Dock & Time Window */}
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <span className="text-xs text-slate-400 print:text-gray-600 block">PINTU DOCK TUJUAN:</span>
                <span className="text-xl font-black text-emerald-400 print:text-emerald-700">
                  {booking.dockName}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block print:text-gray-600">Tanggal Kedatangan:</span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    {formatDateIndo(booking.startTime)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block print:text-gray-600">Slot Waktu:</span>
                  <span className="font-mono font-bold text-blue-400 print:text-blue-700">
                    {formatTimeHM(booking.startTime)} - {formatTimeHM(booking.endTime)} WIB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 print:bg-white print:border-gray-300">
              <div>
                <span className="text-slate-400 block print:text-gray-600">Vendor / Supplier:</span>
                <span className="font-bold text-slate-200 print:text-black">{booking.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 block print:text-gray-600">Nomor Referensi PO:</span>
                <span className="font-mono font-bold text-indigo-400 print:text-indigo-700">{booking.poNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 print:bg-white print:border-gray-300">
              <div>
                <span className="text-slate-400 block print:text-gray-600">No. Polisi Armada:</span>
                <span className="font-mono font-bold text-base text-cyan-400 print:text-cyan-800">{booking.licensePlate}</span>
              </div>
              <div>
                <span className="text-slate-400 block print:text-gray-600">Jenis Kendaraan:</span>
                <span className="font-medium text-slate-200 print:text-black">{booking.vehicleName}</span>
              </div>
              <div>
                <span className="text-slate-400 block print:text-gray-600">Nama Supir:</span>
                <span className="font-medium text-slate-200 print:text-black">{booking.driverName}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 print:bg-white print:border-gray-300">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block print:text-gray-600">Deskripsi Barang:</span>
                  <span className="font-medium text-slate-200 print:text-black">{booking.itemDescription}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block print:text-gray-600">Total Kuantitas:</span>
                  <span className="font-bold text-sm text-white print:text-black">
                    {booking.qty.toLocaleString()} {booking.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Operating Procedure Instructions */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 print:border-gray-300 print:text-gray-600">
            <span className="font-bold text-slate-200 print:text-black block flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Ketentuan Pengemudi & Masuk Pabrik:
            </span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Wajib tiba di pos satpam paling lambat 15 menit sebelum slot dimulai.</li>
              <li>Wajib memakai APD standar (Rompi High-Vis, Sepatu Safety, & Helm).</li>
              <li>Tunjukkan QR code ini ke petugas Security Gate untuk verifikasi Check-In otomatis.</li>
              <li>Batas maksimal kedatangan booking pabrik adalah pukul 19:00 WIB.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
