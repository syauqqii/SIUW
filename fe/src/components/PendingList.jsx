import { useState } from 'react';
import client from '../api/client';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function PendingList({ items, loading, onRefresh }) {
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(null);

  async function handleDecision(id, status) {
    setProcessing(id);
    try {
      await client.put(`/payments/${id}/status`, { status });
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui status');
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400 text-base">Tidak ada pembayaran yang menunggu persetujuan</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-navy text-base">{p.user_name || 'Warga'}</p>
                <p className="text-gray-500 text-sm">No. {p.house_no}</p>
              </div>
              <span className="badge-pending">Menunggu</span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>{MONTHS[Number(p.month) - 1]} {p.year}</span>
              <span className="font-semibold text-navy">{fmt(p.amount)}</span>
            </div>

            {p.image_url && (
              <button
                type="button"
                onClick={() => setPreview(p.image_url)}
                className="w-full mb-3 h-32 bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={p.image_url}
                  alt="Bukti pembayaran"
                  className="w-full h-full object-cover"
                />
              </button>
            )}

            <div className="flex gap-2">
              <button
                className="btn-approve flex-1"
                onClick={() => handleDecision(p.id, 'approved')}
                disabled={processing === p.id}
              >
                {processing === p.id ? '...' : 'Setujui'}
              </button>
              <button
                className="btn-reject flex-1"
                onClick={() => handleDecision(p.id, 'rejected')}
                disabled={processing === p.id}
              >
                {processing === p.id ? '...' : 'Tolak'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image preview modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <img
            src={preview}
            alt="Preview bukti"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
}
