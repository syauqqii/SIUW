import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import PaymentHistory from '../components/PaymentHistory';
import ReceiptUpload from '../components/ReceiptUpload';

const TABS = [
  { id: 'status', label: 'Status Iuran' },
  { id: 'upload', label: 'Bayar' },
];

export default function WargaDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('status');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await client.get('/payments');
      setPayments(data);
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="poly-bg px-6 pt-10 pb-8 relative overflow-hidden">
        <svg className="absolute top-0 right-0 w-40 h-40 opacity-10" viewBox="0 0 160 160">
          <polygon points="160,0 160,160 0,0" fill="#C9973A" />
          <polygon points="160,60 160,160 60,160" fill="#D4AA5C" />
        </svg>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-1">
              Iuran Warga
            </p>
            <h2 className="text-white text-xl font-bold">
              {user?.house_no ? `No. ${user.house_no}` : 'Dashboard'}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">{user?.phone}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 text-sm min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-h-[48px] text-base font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-navy text-navy'
                : 'border-transparent text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 overflow-y-auto">
        {tab === 'status' ? (
          <PaymentHistory payments={payments} loading={loading} />
        ) : (
          <ReceiptUpload
            onSuccess={() => {
              fetchPayments();
              setTab('status');
            }}
          />
        )}
      </div>
    </div>
  );
}
