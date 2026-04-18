import { notFound } from 'next/navigation';
import { initDb, getBranchBySlug, getCategoriesByBranch, getProductsByCategory, getSettings } from '@/lib/db';
import MenuClient from '@/components/MenuClient';
import ThemeBanner from '@/components/themes/ThemeBanner';
import ThemeGrid from '@/components/themes/ThemeGrid';

export const dynamic = 'force-dynamic';

type Branch = { id: number; name: string; slug: string; address: string; phone: string; working_hours: string; wifi_password: string; logo_url: string; cover_url: string; theme: string; instagram: string; contact_email: string };

export default async function BranchMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  initDb();

  const branch = getBranchBySlug(slug) as Branch | undefined;
  if (!branch) notFound();

  const settings = getSettings();
  const categories = getCategoriesByBranch(branch.id) as Array<{
    id: number; name: string; slug: string; icon: string; sort_order: number; cover_url: string;
  }>;

  const menuData = categories.map((cat) => ({
    ...cat,
    products: getProductsByCategory(cat.id) as Array<{
      id: number; name: string; description: string; price: number;
      image_url: string; is_featured: number; is_available: number;
    }>,
  }));

  const theme = branch.theme || 'classic';

  if (theme === 'banner') {
    return <ThemeBanner menuData={menuData} settings={settings} branch={branch} />;
  }
  if (theme === 'grid') {
    return <ThemeGrid menuData={menuData} settings={settings} branch={branch} />;
  }
  return <MenuClient menuData={menuData} settings={settings} branch={branch} />;
}
