import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isLogin = cookieStore.get('admin-auth');

  // 🔥 kalau belum login → lempar ke login
  if (!isLogin) {
    redirect('/admin-login');
  }

  return <>{children}</>;
}