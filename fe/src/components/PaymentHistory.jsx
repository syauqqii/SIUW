import { useState } from 'react';

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

function bestPayment(payments, month, year) {
  const matches = payments.filter(
    (p) => Number(p.month) === month && Number(p.year) === year
  );
  return (
    matches.find((p) => p.status === 'approved') ||
    matches.find((p) => p.status === 'pending') ||
    matches.find((p) => p.status === 'rejected') ||
    null
  );
}

function allForMonth(payments, month, year) {
  return [...payments.filter(
    (p) => Number(p.month) === month && Number(p.year) === year
  )].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function YearPicker({ years, selected, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-navy text-white text-sm font-semibold"
      >
        {selected}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-11 left-0 bg-white rounded-2xl shadow-xl z-20 overflow-hidden border border-gray-100 min-w-[100px]">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => { onChange(y); setOpen(false); }}
                className={`block w-full px-5 py-3 text-left text-sm font-semibold transition-colors ${
                  y === selected ? 'bg-navy text-white' : 'text-navy hover:bg-gray-50'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeroCard({ payment, month, year, isCurrentYear, onUploadRequest }) {
  const now = new Date();
  const isCurrentMonth = isCurrentYear && month === now.getMonth() + 1;
  const label = `${MONTHS[month - 1]} ${year}`;

  if (!payment || payment.status === 'rejected') {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-navy font-bold text-xl mb-1">
          {payment?.status === 'rejected' ? 'Pembayaran Ditolak' : 'Belum Bayar'}
        </p>
        {payment?.status === 'rejected' && (
          <p className="text-red-500 text-sm mb-3">Bukti sebelumnya ditolak — silakan upload ulang</p>
        )}
        {isCurrentMonth && onUploadRequest && (
          <button className="btn-primary mt-2" onClick={onUploadRequest}>
            Upload Bukti Bayar
          </button>
        )}
      </div>
    );
  }

  if (payment.status === 'pending') {
    return (
      <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-5">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-amber-700 font-bold text-xl mb-1">Menunggu Verifikasi</p>
        <p className="text-amber-600 text-sm">{fmt(payment.amount)} · sedang ditinjau admin</p>
      </div>
    );
  }

  return (
    <div className="poly-bg rounded-2xl p-5 relative overflow-hidden">
      <svg className="absolute top-0 right-0 w-28 h-28 opacity-10 pointer-events-none" viewBox="0 0 112 112">
        <polygon points="112,0 112,112 0,0" fill="#C9973A" />
      </svg>
      <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-white font-bold text-2xl mb-0.5">LUNAS</p>
      <p className="text-gray-300 text-sm">{fmt(payment.amount)}</p>
      {payment.updated_at && (
        <p className="text-gray-500 text-xs mt-2">Disetujui {fmtDate(payment.updated_at)}</p>
      )}
    </div>
  );
}

function MonthGrid({ payments, selectedYear, currentYear, currentMonth, onMonthClick }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {MONTHS_SHORT.map((label, i) => {
        const month = i + 1;
        const isCurrent = selectedYear === currentYear && month === currentMonth;
        const p = bestPayment(payments, month, selectedYear);
        const status = p?.status;

        let cellClass = 'border-gray-100 bg-gray-50 text-gray-400';
        let dot = 'bg-gray-200';
        let textLabel = '—';

        if (status === 'approved') {
          cellClass = isCurrent
            ? 'border-navy bg-navy text-white'
            : 'border-navy/30 bg-navy/5 text-navy';
          dot = 'bg-navy';
          textLabel = 'Lunas';
        } else if (status === 'pending') {
          cellClass = 'border-amber-300 bg-amber-50 text-amber-700';
          dot = 'bg-amber-400';
          textLabel = 'Proses';
        } else if (status === 'rejected') {
          cellClass = 'border-red-200 bg-red-50 text-red-500';
          dot = 'bg-red-400';
          textLabel = 'Tolak';
        }

        return (
          <button
            key={month}
            onClick={() => onMonthClick(month)}
            className={`rounded-xl border-2 p-2.5 text-center relative active:scale-95 transition-transform ${cellClass} ${isCurrent ? 'ring-2 ring-offset-1 ring-navy/40' : ''}`}
          >
            {isCurrent && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-gold text-navy px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                ini
              </span>
            )}
            <p className="text-xs font-semibold mt-0.5">{label}</p>
            <div className={`w-1.5 h-1.5 rounded-full mx-auto my-1 ${dot}`} />
            <p className="text-[9px] leading-none opacity-80">{textLabel}</p>
          </button>
        );
      })}
    </div>
  );
}

function MonthDetailModal({ month, year, payments, onClose, onUploadRequest }) {
  const [imgPreview, setImgPreview] = useState(null);
  const entries = allForMonth(payments, month, year);
  const best = bestPayment(payments, month, year);
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const statusLabel = { approved: 'Lunas', pending: 'Menunggu', rejected: 'Ditolak' };
  const statusClass = { approved: 'badge-approved', pending: 'badge-pending', rejected: 'badge-rejected' };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[480px] rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-navy font-bold text-lg">{MONTHS[month - 1]} {year}</h3>
          <button onClick={onClose} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 text-xl">
            &#x2715;
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Belum ada pembayaran untuk bulan ini</p>
            {isCurrentMonth && onUploadRequest && (
              <button className="btn-primary" onClick={() => { onClose(); onUploadRequest(); }}>
                Upload Bukti Bayar
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((p, i) => (
              <div key={p.id} className={`rounded-xl border-2 p-4 ${p.status === 'approved' ? 'border-navy/20 bg-navy/5' : p.status === 'pending' ? 'border-amber-200 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-navy font-semibold text-base">{fmt(p.amount)}</p>
                    <p className="text-gray-400 text-xs">{fmtDate(p.created_at)}</p>
                  </div>
                  <span className={statusClass[p.status]}>{statusLabel[p.status]}</span>
                </div>

                {p.status === 'approved' && p.updated_at && (
                  <p className="text-gray-500 text-xs">Disetujui {fmtDate(p.updated_at)}</p>
                )}
                {p.status === 'rejected' && (
                  <p className="text-red-500 text-xs mt-1">Ditolak — bukti tidak valid</p>
                )}

                {p.image_url && (
                  <button
                    className="mt-3 w-full h-36 rounded-lg overflow-hidden bg-gray-100"
                    onClick={() => setImgPreview(p.image_url)}
                  >
                    <img src={p.image_url} alt="Bukti" className="w-full h-full object-cover" />
                  </button>
                )}
              </div>
            ))}

            {(best?.status === 'rejected' || !best) && isCurrentMonth && onUploadRequest && (
              <button className="btn-primary" onClick={() => { onClose(); onUploadRequest(); }}>
                Upload Ulang Bukti
              </button>
            )}
          </div>
        )}
      </div>

      {imgPreview && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setImgPreview(null)}>
          <img src={imgPreview} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

export default function PaymentHistory({ payments, loading, onUploadRequest }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Always show 5 years back; include data years older than that; cap at current year (no future)
  const dataYears = payments.map((p) => Number(p.year)).filter((y) => y <= currentYear);
  const defaultRange = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const availableYears = [...new Set([...defaultRange, ...dataYears])].sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const isCurrentYear = selectedYear === currentYear;
  const heroMonth = isCurrentYear ? currentMonth : 12;
  const heroPayment = bestPayment(payments, heroMonth, selectedYear);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-9 w-16 rounded-full bg-gray-100 animate-pulse" />)}
        </div>
        <div className="rounded-2xl h-28 bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {Array(12).fill(0).map((_, i) => <div key={i} className="rounded-xl h-16 bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <YearPicker years={availableYears} selected={selectedYear} onChange={setSelectedYear} />

        <HeroCard
          payment={heroPayment}
          month={heroMonth}
          year={selectedYear}
          isCurrentYear={isCurrentYear}
          onUploadRequest={onUploadRequest}
        />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{selectedYear}</p>
          <MonthGrid
            payments={payments}
            selectedYear={selectedYear}
            currentYear={currentYear}
            currentMonth={currentMonth}
            onMonthClick={(m) => setSelectedMonth(m)}
          />
        </div>

        <p className="text-center text-gray-300 text-xs">Ketuk bulan untuk melihat detail</p>
      </div>

      {selectedMonth && (
        <MonthDetailModal
          month={selectedMonth}
          year={selectedYear}
          payments={payments}
          onClose={() => setSelectedMonth(null)}
          onUploadRequest={onUploadRequest}
        />
      )}
    </>
  );
}
