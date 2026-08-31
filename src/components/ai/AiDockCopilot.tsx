import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { extractDateStr, formatTimeHM } from '../../lib/slotEngine';

export const AiDockCopilot: React.FC = () => {
  const { bookings, docks, vehicles, selectedDate, purchaseOrders } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; time: string; recommendations?: string[] }>
  >([
    {
      sender: 'ai',
      text: 'Halo! Saya AI Dock Copilot. Saya menganalisis kepadatan dock, deteksi potensi bottleneck antrean truk, dan memberikan saran alokasi armada optimal untuk operasional pabrik hari ini.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      recommendations: [
        'Analisis bottleneck antrean jadwal hari ini',
        'Rekomendasi optimasi alokasi dock tangki & kontainer',
        'Status PO prioritas yang belum terjadwal',
      ],
    },
  ]);

  const dateBookings = bookings.filter(
    (b) => extractDateStr(b.startTime) === selectedDate && b.status !== 'CANCELLED'
  );

  const handleAskAi = async (customText?: string) => {
    const textToSend = customText || userPrompt;
    if (!textToSend.trim()) return;

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [...prev, { sender: 'user', text: textToSend, time: nowTime }]);
    setUserPrompt('');
    setIsLoading(true);

    // Simulated Smart Logistical Optimization Engine
    setTimeout(() => {
      let aiResponseText = '';
      const recs: string[] = [];

      const lower = textToSend.toLowerCase();

      if (lower.includes('bottleneck') || lower.includes('antre') || lower.includes('kepadatan')) {
        const peakBookings = dateBookings.filter((b) => {
          const h = new Date(b.startTime).getHours();
          return h >= 10 && h <= 15;
        });

        aiResponseText = `📊 **Hasil Analisis Kepadatan Jadwal (${selectedDate}):**\n` +
          `• Terdapat ${dateBookings.length} booking armada terdaftar hari ini.\n` +
          `• **Titik Kepadatan (Peak Hours):** Jam 10:00 - 15:00 WIB terisi ${peakBookings.length} truk (${Math.round((peakBookings.length / (dateBookings.length || 1)) * 100)}% dari total volume).\n` +
          `• **Saran Mitigasi:** Arahkan supplier bermuatan box ringan (CDE/CDD) ke slot pagi pukul 08:30 atau slot sore pukul 16:30 WIB di Dock 01 & 02 untuk menghindari antrean gerbang security.`;
        
        recs.push('Simulasikan pengalihan ke Dock 02', 'Cek utilisasi Dock 03 Fast Pallet');
      } else if (lower.includes('tangki') || lower.includes('isotank') || lower.includes('kontainer')) {
        aiResponseText = `🚚 **Status Alokasi Dock Khusus:**\n` +
          `• **Dock 04 (Bay Tangki / Isotank):** Memiliki antrean transfer kimia cair. Pastikan SOP QC sampling bahan kimia telah siap 15 menit sebelum truk tiba di gate.\n` +
          `• **Dock 05 (Container High Bay):** Utilisasi tinggi untuk kontainer 20/40ft. Durasi standar 240 menit terkunci aman.`;
      } else if (lower.includes('po') || lower.includes('prioritas') || lower.includes('belum')) {
        const unscheduled = purchaseOrders.filter((p) => p.status === 'PPIC_APPROVED');
        aiResponseText = `📋 **PO Disetujui PPIC yang Belum Dibooking Supplier (${unscheduled.length} PO):**\n` +
          unscheduled.map((p) => `• ${p.poNumber} (${p.supplierName}) - ${p.itemDescription} (${p.qty} ${p.unit})`).join('\n') +
          `\n\n💡 Kirimkan pengingat email/WhatsApp otomatis ke vendor untuk segera memilih slot kedatangan sebelum jam 19:00 WIB.`;
      } else {
        aiResponseText = `Berdasarkan jadwal tanggal **${selectedDate}**, utilisasi dock pabrik berada dalam level aman (efisiensi ~78%). Durasi bongkar terkunci otomatis sesuai armada (CDE 60m, CDD 90m, Fuso 120m, Isotank 180m, Kontainer 240m), menjaga agar tidak terjadi tumpang tindih waktu di setiap pintu.`;
      }

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          recommendations: recs.length > 0 ? recs : undefined,
        },
      ]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3.5 rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:scale-105 text-white shadow-2xl shadow-indigo-500/30 flex items-center space-x-2.5 transition-all cursor-pointer border border-indigo-400/40"
        >
          <div className="p-1 rounded-lg bg-white/20">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <span className="font-bold text-xs">AI Dock Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-linear-to-tr from-blue-600 to-purple-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">AI Dock Copilot</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Logistical Optimizer Active
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[88%] whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>

                {/* AI Quick Recommendation Chips */}
                {msg.recommendations && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                    {msg.recommendations.map((rec, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => handleAskAi(rec)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] text-left transition-colors cursor-pointer"
                      >
                        ⚡ {rec}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>AI sedang menganalisis jadwal dock...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-800 bg-slate-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Tanyakan optimasi slot atau bottleneck..."
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!userPrompt.trim() || isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
