import { FormEvent, useState } from 'react';
import { useAuth } from './AuthProvider';

export default function LoginPage() {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [authProvider, setAuthProvider] = useState<'local' | 'tfs'>('local');
  const [domain, setDomain] = useState('');
  const submitLogin = async (event: FormEvent) => { event.preventDefault(); await auth.login(username, password, authProvider, domain); };
  const submitOtp = async (event: FormEvent) => { event.preventDefault(); await auth.verifyOtp(code); };

  if (auth.status === 'otp_required') return <form className="auth-card" onSubmit={submitOtp}><h2>Xác thực 2 bước</h2><p>{auth.challenge?.maskedEmail ? `Mã đã gửi tới ${auth.challenge.maskedEmail}` : 'Nhập mã xác thực của bạn.'}</p><input aria-label="Mã xác thực" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" required /><button type="submit">Xác nhận</button>{auth.error && <p className="error">{auth.error}</p>}</form>;
  return <form className="auth-card" onSubmit={submitLogin}>
    <h2>Đăng nhập FiinGroupApp</h2>
    <label>Nhà cung cấp xác thực<select value={authProvider} onChange={(e) => setAuthProvider(e.target.value as 'local' | 'tfs')}><option value="local">Jarvis account / email</option><option value="tfs">TFS domain account</option></select></label>
    {authProvider === 'tfs' && <label>Domain<input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="DOMAIN" required /></label>}
    <label>Tài khoản<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={authProvider === 'tfs' ? 'username hoặc DOMAIN\\username' : undefined} required /></label>
    <label>Mật khẩu<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
    <button type="submit" disabled={auth.status === 'authenticating'}>{auth.status === 'authenticating' ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    {auth.error && <p className="error">{auth.error}</p>}
  </form>;
}
