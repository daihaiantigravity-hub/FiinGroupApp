import { useAuth } from './AuthProvider';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <section><h2>Thông tin tài khoản</h2><dl><dt>Đăng nhập</dt><dd>{user.login}</dd><dt>Họ tên</dt><dd>{user.fullName || 'Chưa cập nhật'}</dd><dt>Chức danh</dt><dd>{user.positionsName || 'Chưa cập nhật'}</dd></dl></section>;
}
