import { notFound } from 'next/navigation';
import { initDb, getBranchBySlug, getCategoriesByBranch, getProductsByCategory, getSettings } from '@/lib/db';
import MenuClient from '@/components/MenuClient';

export const dynamic = 'force-dynamic';

type Branch = { id: number; name: string; slug: string; address: string; phone: string; working_hours: string; wifi_password: string };

export default async function BranchMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  initDb();

  const branch = getBranchBySlug(slug) as Branch | undefined;
  if (!branch) notFound();

  const settings = getSettings();
  const categories = getCategoriesByBranch(branch.id) as Array<{
    id: number; name: string; slug: string; icon: string; sort_order: number;
  }>;

  const menuData = categories.map((cat) => ({
    ...cat,
    products: getProductsByCategory(cat.id) as Array<{
      id: number; name: string; description: string; price: number;
      image_url: string; is_featured: number; is_available: number;
    }>,
  }));

  return <MenuClient menuData={menuData} settings={settings} branch={branch} />;
}
