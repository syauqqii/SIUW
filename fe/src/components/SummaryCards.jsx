import { useState } from 'react';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

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

function DonutChart({ rate, label }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, rate)) * circ;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r}
        fill="none" stroke="#C9973A" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="36" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">
        {Math.round(rate * 100)}%
      </text>
      <text x="40" y="50" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">
        {label}
      </text>
    </svg>
  );
}

function BarChart({ rows, selectedYear }) {
  const totals = MONTH_LABELS.map((_, i) => {
    const month = i + 1;
    return (rows || [])
      .filter((r) => Number(r.month) === month && Number(r.year) === selectedYear && r.status === 'approved')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const maxVal = Math.max(...totals, 1);
  const BAR_MAX_H = 64;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Rekap {selectedYear}
      </p>
      <div className="flex items-end gap-1 h-20">
        {MONTH_LABELS.map((label, i) => {
          const isCurrent = selectedYear === currentYear && i + 1 === currentMonth;
          const h = Math.max(totals[i] > 0 ? 4 : 0, (totals[i] / maxVal) * BAR_MAX_H);
          return (
            <div key={label} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-t-md ${isCurrent ? 'bg-gold' : 'bg-navy-700'}`}
                style={{ height: h, backgroundColor: isCurrent ? '#C9973A' : '#1A2F4A' }}
              />
              <span className={`text-[9px] font-medium ${isCurrent ? 'text-navy font-bold' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SummaryCards({ data, loading }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const rows = data?.rows || [];
  // Always show 5 years back; include data years older than that; cap at current year (no future)
  const dataYears = rows.map((r) => Number(r.year)).filter((y) => y <= currentYear);
  const defaultRange = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const availableYears = [...new Set([...defaultRange, ...dataYears])].sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const isCurrentYear = selectedYear === currentYear;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {[1, 2].map((i) => <div key={i} className="h-9 w-16 rounded-full bg-gray-100 animate-pulse" />)}
        </div>
        <div className="rounded-2xl bg-navy h-32 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="card h-20 animate-pulse bg-gray-100" />
          <div className="card h-20 animate-pulse bg-gray-100" />
        </div>
        <div className="card h-28 animate-pulse bg-gray-100" />
      </div>
    );
  }

  // Year-filtered collected total
  const collectedYear = rows
    .filter((r) => Number(r.year) === selectedYear && r.status === 'approved')
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  // Donut: current month rate (always real-time, regardless of year filter)
  const paidThisMonth = new Set(
    rows
      .filter((r) => Number(r.month) === currentMonth && Number(r.year) === currentYear && r.status === 'approved')
      .map((r) => r.house_no)
  ).size;
  const totalUnpaid = data?.total_unpaid || 0;
  const totalWarga = paidThisMonth + totalUnpaid;
  const rate = totalWarga > 0 ? paidThisMonth / totalWarga : 0;

  // Year-filtered pending
  const pendingYear = isCurrentYear
    ? (data?.total_pending || 0)
    : rows.filter((r) => Number(r.year) === selectedYear && r.status === 'pending')
        .reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-3">
      <YearPicker years={availableYears} selected={selectedYear} onChange={setSelectedYear} />

      {/* Hero card */}
      <div className="poly-bg rounded-2xl p-5 relative overflow-hidden">
        <svg className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none" viewBox="0 0 128 128">
          <polygon points="128,0 128,128 0,0" fill="#C9973A" />
        </svg>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-gold text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">
              {isCurrentYear ? `Total ${selectedYear}` : selectedYear}
            </p>
            <p className="text-white text-2xl font-bold leading-tight truncate">
              {fmt(collectedYear)}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {isCurrentYear
                ? `${paidThisMonth} dari ${totalWarga} warga bayar bulan ini`
                : `terkumpul sepanjang ${selectedYear}`}
            </p>
            {isCurrentYear && (
              <p className="text-gray-500 text-[11px] mt-1.5">
                All-time: {fmt(data?.total_collected)}
              </p>
            )}
          </div>
          {isCurrentYear && <DonutChart rate={rate} label="bln ini" />}
        </div>
      </div>

      {/* Two metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card border-l-4 border-l-amber-400">
          <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wide mb-1">Menunggu</p>
          <p className="text-navy text-lg font-bold leading-tight">{fmt(pendingYear)}</p>
          <p className="text-gray-400 text-[11px] mt-0.5">
            {isCurrentYear ? 'perlu diverifikasi' : String(selectedYear)}
          </p>
        </div>
        <div className="card border-l-4 border-l-gray-300">
          <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wide mb-1">Belum Bayar</p>
          <p className="text-navy text-lg font-bold leading-tight">{totalUnpaid} warga</p>
          <p className="text-gray-400 text-[11px] mt-0.5">bulan ini</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <BarChart rows={rows} selectedYear={selectedYear} />
      </div>
    </div>
  );
}
