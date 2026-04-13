import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { initDb, getCategories, getAllProductsWithCategory, getSettings } from '@/lib/db';
import AdminDashboard from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getAuthSession();
  if (!session) redirect('/admin/login');

  initDb();
  const categories = getCategories();
  const products = getAllProductsWithCategory();
  const settings = getSettings();

  return (
    <AdminDashboard
      categories={categories as never}
      products={products as never}
      settings={settings}
      username={session.username}
    />
  );
}
