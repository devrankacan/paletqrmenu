import { initDb, getCategories, getProductsByCategory, getSettings } from '@/lib/db';
import MenuClient from '@/components/MenuClient';

export const dynamic = 'force-dynamic';

export default function MenuPage() {
  initDb();
  const categories = getCategories() as Array<{
    id: number; name: string; slug: string; icon: string; sort_order: number;
  }>;
  const settings = getSettings();

  const menuData = categories.map((cat) => ({
    ...cat,
    products: getProductsByCategory(cat.id) as Array<{
      id: number; name: string; description: string; price: number;
      image_url: string; is_featured: number; is_available: number;
    }>,
  }));

  return <MenuClient menuData={menuData} settings={settings} />;
}
