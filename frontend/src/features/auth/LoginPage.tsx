import { FormEvent, useState } from 'react';
import { useAuth } from './AuthProvider';

export default function LoginPage() {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const submitLogin = async (event: FormEvent) => { event.preventDefault(); await auth.login(username, password); };
  const submitOtp = async (event: FormEvent) => { event.preventDefault(); await auth.verifyOtp(code); };
  if (auth.status === 'otp_required') return <form className="auth-card" onSubmit={submitOtp}><h2>Xác thực 2 bước</h2><p>{auth.challenge?.maskedEmail ? `Mã đã gửi tới ${auth.challenge.maskedEmail}` : 'Nhập mã xác thực của bạn.'}</p><input aria-label="Mã xác thực" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" required /><button type="submit">Xác nhận</button>{auth.error && <p className="error">{auth.error}</p>}</form>;
  return <form className="auth-card" onSubmit={submitLogin}><h2>Đăng nhập FiinGroupApp</h2><label>Tài khoản<input value={username} onChange={(e) => setUsername(e.target.value)} required /></label><label>Mật khẩu<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><button type="submit" disabled={auth.status === 'authenticating'}>{auth.status === 'authenticating' ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>{auth.error && <p className="error">{auth.error}</p>}</form>;
}
