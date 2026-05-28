import { useState } from 'react';
import client from '../api/client';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function UserManagement({ warga, loading, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showManual, setShowManual] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', house_no: '', password: '' });
  const [manualForm, setManualForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'paid', amount: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  function openAdd() {
    setEditTarget(null);
    setForm({ name: '', phone: '', house_no: '', password: '' });
    setError('');
    setShowForm(true);
  }

  function openEdit(w) {
    setEditTarget(w);
    setForm({ name: w.name || '', phone: w.phone || '', house_no: w.house_no || '', password: '' });
    setError('');
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        const payload = {};
        if (form.name) payload.name = form.name;
        if (form.phone) payload.phone = form.phone;
        if (form.house_no) payload.house_no = form.house_no;
        if (form.password) payload.password = form.password;
        await client.put(`/warga/${editTarget.id}`, payload);
      } else {
        await client.post('/warga', form);
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus warga ini?')) return;
    try {
      await client.delete(`/warga/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus');
    }
  }

  async function handleManualStatus(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await client.post('/payments/manual', {
        user_id: showManual.id,
        month: manualForm.month,
        year: manualForm.year,
        status: manualForm.status,
        amount: manualForm.amount,
      });
      setShowManual(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengubah status');
    } finally {
      setSaving(false);
    }
  }

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

  const q = search.trim().toLowerCase();
  const filtered = q
    ? warga.filter(
        (w) =>
          (w.name || '').toLowerCase().includes(q) ||
          (w.phone || '').includes(q) ||
          (w.house_no || '').toLowerCase().includes(q)
      )
    : warga;

  return (
    <>
      <button className="btn-primary mb-3" onClick={openAdd}>
        Tambah Warga
      </button>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          className="input-field pl-10 pr-10"
          placeholder="Cari nama, no. rumah, atau telepon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg leading-none"
          >
            &#x2715;
          </button>
        )}
      </div>

      {!warga.length ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">Belum ada data warga</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm">Tidak ada warga yang cocok dengan</p>
          <p className="text-navy font-semibold mt-1">"{search}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {q && (
            <p className="text-xs text-gray-400 px-1">
              {filtered.length} hasil untuk &ldquo;{search}&rdquo;
            </p>
          )}
          {filtered.map((w) => (
            <div key={w.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-navy text-base">{w.name || '-'}</p>
                  <p className="text-gray-500 text-sm">No. {w.house_no} &middot; {w.phone}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn-approve text-xs px-3 py-2 min-h-0 h-9"
                  onClick={() => openEdit(w)}
                >
                  Edit
                </button>
                <button
                  className="btn-secondary text-xs px-3 py-2 min-h-0 h-9 w-auto"
                  onClick={() => { setShowManual(w); setError(''); }}
                >
                  Ubah Status
                </button>
                <button
                  className="btn-danger text-xs px-3 py-2 min-h-0 h-9"
                  onClick={() => handleDelete(w.id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <Modal title={editTarget ? 'Edit Warga' : 'Tambah Warga'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="input-label">Nama Lengkap</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required={!editTarget} />
            </div>
            <div>
              <label className="input-label">Nomor Telepon</label>
              <input className="input-field" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required={!editTarget} />
            </div>
            <div>
              <label className="input-label">Nomor Rumah</label>
              <input className="input-field" value={form.house_no} onChange={(e) => setForm({ ...form, house_no: e.target.value })} required={!editTarget} />
            </div>
            <div>
              <label className="input-label">{editTarget ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</label>
              <input className="input-field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editTarget} />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </form>
        </Modal>
      )}

      {/* Manual status modal */}
      {showManual && (
        <Modal title={`Status Pembayaran - ${showManual.name}`} onClose={() => setShowManual(null)}>
          <form onSubmit={handleManualStatus} className="space-y-4">
            <div>
              <label className="input-label">Bulan</label>
              <select className="input-field" value={manualForm.month} onChange={(e) => setManualForm({ ...manualForm, month: e.target.value })}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Tahun</label>
              <input className="input-field" type="number" value={manualForm.year} onChange={(e) => setManualForm({ ...manualForm, year: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Status</label>
              <select className="input-field" value={manualForm.status} onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}>
                <option value="paid">Lunas</option>
                <option value="unpaid">Belum Bayar</option>
              </select>
            </div>
            {manualForm.status === 'paid' && (
              <div>
                <label className="input-label">Jumlah (Rp)</label>
                <input className="input-field" type="number" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })} placeholder="0" />
              </div>
            )}
            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-navy font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 text-2xl font-light">
            &#x2715;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
