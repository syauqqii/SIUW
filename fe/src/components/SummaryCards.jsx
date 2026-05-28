const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

function DonutChart({ rate }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, rate)) * circ;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke="#C9973A"
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="36" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">
        {Math.round(rate * 100)}%
      </text>
      <text x="40" y="50" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">
        lunas
      </text>
    </svg>
  );
}

function BarChart({ rows }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: MONTH_LABELS[d.getMonth()], isCurrent: i === 5 };
  });

  const totals = months.map(({ month, year }) => {
    const sum = (rows || [])
      .filter((r) => Number(r.month) === month && Number(r.year) === year && r.status === 'approved')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    return sum;
  });

  const maxVal = Math.max(...totals, 1);
  const BAR_MAX_H = 64;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Rekap 6 Bulan Terakhir
      </p>
      <div className="flex items-end gap-1.5 h-20">
        {months.map((m, i) => {
          const h = Math.max(totals[i] > 0 ? 4 : 0, (totals[i] / maxVal) * BAR_MAX_H);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-t-md transition-all ${m.isCurrent ? 'bg-gold' : 'bg-navy-700'}`}
                style={{ height: h }}
              />
              <span className={`text-[10px] font-medium ${m.isCurrent ? 'text-navy' : 'text-gray-400'}`}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SummaryCards({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-navy h-32 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="card h-20 animate-pulse bg-gray-100" />
          <div className="card h-20 animate-pulse bg-gray-100" />
        </div>
        <div className="card h-28 animate-pulse bg-gray-100" />
      </div>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const rows = data?.rows || [];

  // Collection this month (approved only)
  const collectedThisMonth = rows
    .filter((r) => Number(r.month) === currentMonth && Number(r.year) === currentYear && r.status === 'approved')
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  // Unique payers this month
  const paidUsersThisMonth = new Set(
    rows
      .filter((r) => Number(r.month) === currentMonth && Number(r.year) === currentYear && r.status === 'approved')
      .map((r) => r.house_no)
  ).size;

  const totalUnpaid = data?.total_unpaid || 0;
  const totalWarga = paidUsersThisMonth + totalUnpaid;
  const rate = totalWarga > 0 ? paidUsersThisMonth / totalWarga : 0;

  return (
    <div className="space-y-3">
      {/* Hero card — current month collection */}
      <div className="poly-bg rounded-2xl p-5 relative overflow-hidden">
        <svg className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none" viewBox="0 0 128 128">
          <polygon points="128,0 128,128 0,0" fill="#C9973A" />
        </svg>

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-gold text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">
              {MONTH_LABELS[currentMonth - 1]} {currentYear}
            </p>
            <p className="text-white text-2xl font-bold leading-tight truncate">
              {fmt(collectedThisMonth)}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {paidUsersThisMonth} dari {totalWarga} warga telah membayar
            </p>
            <p className="text-gray-500 text-[11px] mt-2">
              Total keseluruhan: {fmt(data?.total_collected)}
            </p>
          </div>
          <DonutChart rate={rate} />
        </div>
      </div>

      {/* Two metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card border-l-4 border-l-amber-400">
          <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wide mb-1">Menunggu</p>
          <p className="text-navy text-lg font-bold leading-tight">{fmt(data?.total_pending)}</p>
          <p className="text-gray-400 text-[11px] mt-0.5">perlu diverifikasi</p>
        </div>
        <div className="card border-l-4 border-l-gray-300">
          <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wide mb-1">Belum Bayar</p>
          <p className="text-navy text-lg font-bold leading-tight">{totalUnpaid} warga</p>
          <p className="text-gray-400 text-[11px] mt-0.5">bulan ini</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <BarChart rows={rows} />
      </div>
    </div>
  );
}
