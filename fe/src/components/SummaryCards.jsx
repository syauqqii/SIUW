const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function SummaryCards({ data, loading }) {
  const cards = [
    { label: 'Terkumpul', value: fmt(data?.total_collected || 0), accent: 'border-l-gold' },
    { label: 'Menunggu', value: fmt(data?.total_pending || 0), accent: 'border-l-amber-400' },
    { label: 'Belum Bayar', value: `${data?.total_unpaid || 0} warga`, accent: 'border-l-red-400' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`card border-l-4 ${c.accent} flex items-center justify-between`}
        >
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{c.label}</p>
          {loading ? (
            <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-navy text-lg font-bold">{c.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
