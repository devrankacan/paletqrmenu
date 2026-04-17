import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { initDb, getBranches, getSettings } from '@/lib/db';
import AdminDashboard from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getAuthSession();
  if (!session) redirect('/admin/login');

  initDb();
  const branches = getBranches();
  const settings = getSettings();

  return (
    <AdminDashboard
      initialBranches={branches as never}
      settings={settings}
      username={session.username}
    />
  );
}
