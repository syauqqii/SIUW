import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import SummaryCards from '../components/SummaryCards';
import PendingList from '../components/PendingList';
import UserManagement from '../components/UserManagement';

const TABS = [
  { id: 'summary', label: 'Ringkasan' },
  { id: 'pending', label: 'Persetujuan' },
  { id: 'warga', label: 'Data Warga' },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('summary');

  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [warga, setWarga] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingWarga, setLoadingWarga] = useState(true);

  const timerRef = useRef(null);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await client.get('/payments/summary');
      setSummary(data);
    } catch {
      // ignore
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await client.get('/payments/pending');
      setPending(data);
    } catch {
      // ignore
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const fetchWarga = useCallback(async () => {
    try {
      const { data } = await client.get('/warga');
      setWarga(data);
    } catch {
      // ignore
    } finally {
      setLoadingWarga(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchSummary();
    fetchPending();
    fetchWarga();
  }, [fetchSummary, fetchPending, fetchWarga]);

  useEffect(() => {
    refreshAll();

    // Auto-refresh every 10s
    timerRef.current = setInterval(() => {
      fetchSummary();
      fetchPending();
    }, 10000);

    return () => clearInterval(timerRef.current);
  }, [refreshAll, fetchSummary, fetchPending]);

  const pendingCount = pending.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="poly-bg px-6 pt-10 pb-8 relative overflow-hidden">
        <svg className="absolute top-0 right-0 w-40 h-40 opacity-10 pointer-events-none" viewBox="0 0 160 160">
          <polygon points="160,0 160,160 0,0" fill="#C9973A" />
          <polygon points="160,60 160,160 60,160" fill="#D4AA5C" />
        </svg>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-1">
              Admin Panel
            </p>
            <h2 className="text-white text-xl font-bold">Iuran Warga</h2>
            <p className="text-gray-400 text-sm mt-0.5">Auto-refresh setiap 10 detik</p>
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
            className={`flex-1 min-h-[48px] text-sm font-semibold border-b-2 transition-colors relative ${
              tab === t.id ? 'border-navy text-navy' : 'border-transparent text-gray-400'
            }`}
          >
            {t.label}
            {t.id === 'pending' && pendingCount > 0 && (
              <span className="absolute top-2 right-2 bg-gold text-navy text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 overflow-y-auto">
        {tab === 'summary' && (
          <SummaryCards data={summary} loading={loadingSummary} />
        )}
        {tab === 'pending' && (
          <PendingList items={pending} loading={loadingPending} onRefresh={refreshAll} />
        )}
        {tab === 'warga' && (
          <UserManagement warga={warga} loading={loadingWarga} onRefresh={refreshAll} />
        )}
      </div>
    </div>
  );
}
