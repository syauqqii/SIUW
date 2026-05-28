import { useState, useRef } from 'react';
import client from '../api/client';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function ReceiptUpload({ onSuccess }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError('Pilih foto bukti pembayaran'); return; }
    if (!amount) { setError('Masukkan jumlah pembayaran'); return; }

    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('month', month);
      fd.append('year', year);
      fd.append('amount', amount);
      fd.append('receipt', file);

      await client.post('/payments', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setFile(null);
      setPreview(null);
      setAmount('');
      fileRef.current.value = '';
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card text-center py-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-2xl font-bold">&#10003;</span>
        </div>
        <p className="text-navy font-semibold text-lg mb-1">Bukti Terkirim</p>
        <p className="text-gray-500 text-sm mb-6">Menunggu konfirmasi admin</p>
        <button className="btn-secondary w-auto px-6 mx-auto" onClick={() => setSuccess(false)}>
          Upload Lagi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Bulan</label>
          <select className="input-field" value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Tahun</label>
          <input
            type="number"
            className="input-field"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2020"
            max="2099"
          />
        </div>
      </div>

      <div>
        <label className="input-label">Jumlah Pembayaran (Rp)</label>
        <input
          type="number"
          className="input-field"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="50000"
          min="1"
          required
        />
        {amount && <p className="text-gray-400 text-sm mt-1">{fmt(amount)}</p>}
      </div>

      <div>
        <label className="input-label">Foto Bukti Pembayaran</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="w-full min-h-[120px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50 active:bg-gray-100"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
          ) : (
            <>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Ambil Foto / Pilih Gambar</span>
            </>
          )}
        </button>
        {preview && (
          <button type="button" className="text-sm text-gray-400 mt-2" onClick={() => { setFile(null); setPreview(null); fileRef.current.value = ''; }}>
            Ganti foto
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
      </button>
    </form>
  );
}
