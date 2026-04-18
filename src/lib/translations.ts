export type Lang = 'tr' | 'en' | 'ar';

export const LANGS: Lang[] = ['tr', 'en', 'ar'];

export function nextLang(current: Lang): Lang {
  return LANGS[(LANGS.indexOf(current) + 1) % LANGS.length];
}

const translations = {
  tr: {
    searchPlaceholder: 'Ürün ara...',
    noResults: 'Sonuç bulunamadı',
    noProducts: 'Henüz ürün eklenmedi',
    noCategories: 'Henüz kategori eklenmedi',
    noCategoryProducts: 'Bu kategoride ürün yok',
    featured: 'ÖNE ÇIKAN',
    info: 'Bilgi',
    items: 'ürün',
    businessInfo: 'İşletme Bilgileri',
    socialMedia: 'Sosyal Medya',
    feedback: 'Geri Bildirim Gönder',
    feedbackEmail: 'E-posta (isteğe bağlı)',
    feedbackMessage: 'Mesajınız *',
    feedbackPlaceholder: 'Görüş ve önerilerinizi yazın...',
    send: 'Gönder',
    thanks: 'Teşekkürler! ✓',
    copy: 'Kopyala',
    copied: '✓',
    wifi: 'Wifi',
    back: '←',
  },
  en: {
    searchPlaceholder: 'Search products...',
    noResults: 'No results found',
    noProducts: 'No products yet',
    noCategories: 'No categories yet',
    noCategoryProducts: 'No products in this category',
    featured: 'FEATURED',
    info: 'Info',
    items: 'items',
    businessInfo: 'Business Info',
    socialMedia: 'Social Media',
    feedback: 'Send Feedback',
    feedbackEmail: 'Email (optional)',
    feedbackMessage: 'Your message *',
    feedbackPlaceholder: 'Write your thoughts...',
    send: 'Send',
    thanks: 'Thank you! ✓',
    copy: 'Copy',
    copied: '✓',
    wifi: 'WiFi',
    back: '←',
  },
  ar: {
    searchPlaceholder: 'ابحث عن منتج...',
    noResults: 'لا توجد نتائج',
    noProducts: 'لا توجد منتجات بعد',
    noCategories: 'لا توجد فئات بعد',
    noCategoryProducts: 'لا توجد منتجات في هذه الفئة',
    featured: 'مميز',
    info: 'معلومات',
    items: 'منتج',
    businessInfo: 'معلومات العمل',
    socialMedia: 'التواصل الاجتماعي',
    feedback: 'إرسال تعليق',
    feedbackEmail: 'البريد الإلكتروني (اختياري)',
    feedbackMessage: 'رسالتك *',
    feedbackPlaceholder: 'اكتب آراءك واقتراحاتك...',
    send: 'إرسال',
    thanks: 'شكراً! ✓',
    copy: 'نسخ',
    copied: '✓',
    wifi: 'واي فاي',
    back: '→',
  },
} as const;

export type Tr = typeof translations.tr;
export default translations;
