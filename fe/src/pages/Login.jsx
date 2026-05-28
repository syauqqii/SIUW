import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('warga');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { role, password };
      if (role === 'admin') payload.email = email;
      else payload.phone = phone;

      const user = await login(payload);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal. Periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="poly-bg px-6 pt-16 pb-12">
        {/* Low poly decorative shapes */}
        <svg className="absolute top-0 right-0 w-48 h-48 opacity-10" viewBox="0 0 200 200">
          <polygon points="200,0 200,200 0,0" fill="#C9973A" />
          <polygon points="200,80 200,200 80,200" fill="#D4AA5C" />
        </svg>

        <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-2">
          Sistem Informasi
        </p>
        <h1 className="text-white text-3xl font-bold leading-tight">
          Iuran Warga
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Silakan masuk untuk melanjutkan
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 pb-8 -mt-4 bg-white rounded-t-3xl">
        {/* Role toggle */}
        <div className="flex rounded-xl overflow-hidden border-2 border-gray-100 mb-6">
          {['warga', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError(''); }}
              className={`flex-1 min-h-[48px] text-base font-semibold capitalize transition-colors ${
                role === r ? 'bg-navy text-white' : 'text-gray-400 bg-white'
              }`}
            >
              {r === 'warga' ? 'Warga' : 'Admin'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'admin' ? (
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>
          ) : (
            <div>
              <label className="input-label">Nomor Telepon</label>
              <input
                type="tel"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                autoComplete="tel"
                required
              />
            </div>
          )}

          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium bg-red-50 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>

        <p className="text-center text-gray-400 text-sm mt-8">
          RT 01 / RW 03
        </p>
      </div>
    </div>
  );
}
