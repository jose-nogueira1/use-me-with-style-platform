import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { C, F } from '../../theme';
import { useAdminAuth } from '../AdminAuthContext';

export function Login() {
  const { user, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname || '/admin';
  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      setError('Incorrect email or password, or the backend (use-me-with-style-cms) is not running yet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.black }}>
      <form
        onSubmit={handleSubmit}
        style={{ width: 340, background: '#0C0A08', padding: 32, borderRadius: 10, border: '1px solid #5F4A1B' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: F.display, fontSize: 28, color: C.onDarkGold, lineHeight: 1 }}>Use Me</div>
          <div style={{ fontSize: 9, fontWeight: 500, color: C.onDarkGold, marginTop: 4 }}>with style</div>
        </div>
        <div style={{ fontSize: 10, color: '#BEB8AE', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20, textAlign: 'center' }}>
          Admin
        </div>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#BEB8AE', marginBottom: 4 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #33291A', background: 'rgba(255,255,255,0.05)', color: C.onDark }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#BEB8AE', marginBottom: 4 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #33291A', background: 'rgba(255,255,255,0.05)', color: C.onDark }}
          />
        </label>

        {error && <div style={{ fontSize: 12, color: '#E1B3AA', marginBottom: 16 }}>{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          style={{ width: '100%', padding: 12, background: C.champagne, color: C.black, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 6 }}
        >
          {submitting ? '…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
