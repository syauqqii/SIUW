const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

function StatusBadge({ status }) {
  if (status === 'approved') return <span className="badge-approved">Lunas</span>;
  if (status === 'pending') return <span className="badge-pending">Menunggu</span>;
  if (status === 'rejected') return <span className="badge-rejected">Ditolak</span>;
  return <span className="badge-unpaid">Belum Bayar</span>;
}

export default function PaymentHistory({ payments, loading }) {
  const currentYear = new Date().getFullYear();

  // Build monthly grid for current year
  const grid = MONTHS.map((label, i) => {
    const month = i + 1;
    const payment = payments.find(
      (p) => Number(p.month) === month && Number(p.year) === currentYear
    );
    return { label, month, payment };
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Monthly status grid */}
      <div className="grid grid-cols-4 gap-2">
        {grid.map(({ label, month, payment }) => {
          const status = payment?.status;
          const isApproved = status === 'approved';
          const isPending = status === 'pending';
          const isRejected = status === 'rejected';

          return (
            <div
              key={month}
              className={`rounded-xl p-3 text-center border-2 ${
                isApproved
                  ? 'border-navy bg-navy text-white'
                  : isPending
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : isRejected
                  ? 'border-red-300 bg-red-50 text-red-600'
                  : 'border-gray-100 bg-gray-50 text-gray-400'
              }`}
            >
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] mt-0.5 leading-tight">
                {isApproved ? 'Lunas' : isPending ? 'Proses' : isRejected ? 'Tolak' : '-'}
              </p>
            </div>
          );
        })}
      </div>

      {/* History log */}
      {payments.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Riwayat</p>
          {[...payments]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((p) => (
              <div key={p.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-navy text-sm">
                    {MONTHS[Number(p.month) - 1]} {p.year}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(p.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-navy font-semibold text-sm">{fmt(p.amount)}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
