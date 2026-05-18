#!/usr/bin/env python3
"""
Kaşüstü şubesine kategorileri ve ürünleri ekler.
Kategori zaten varsa üzerine yazar, yoksa oluşturur.
"""
import sqlite3
import re

DB_PATH = '/var/www/paletpastanesi/data/menu.db'

def make_slug(name, branch_id):
    s = name.lower()
    for a, b in [('ı','i'),('ğ','g'),('ü','u'),('ş','s'),('ö','o'),('ç','c')]:
        s = s.replace(a, b)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return f"{s}-{branch_id}"

MENU = [
    ("Kahvaltılıklar", [
        ("Kahvaltı Tabağı", 520, "Kars kaşarı, süzme peynir, beyaz peynir, domates, salatalık, zeytin, tereyağı, bal, reçel, kaygana, patates, börek, roka, maydanoz, krem çikolata, kayısı, ceviz, haşlanmış yumurta"),
        ("Simit Kahvaltı", 200, "Simit yanında peynir çeşitleri, zeytin, reçel, çikolata, domates ve salatalık ile servis edilir."),
        ("Köy Kahvaltısı", 600, "Tulum peyniri, otlu peynir, Van ve Kars kaşarı, soğuk kavurma, domates, salatalık, köy biberi, bal, kaymak ve iki adet sahanda köy yumurtası ile servis edilir."),
        ("Serpme Kahvaltı", 1400, "Peynir Tabağı: Kars Kaşarı, Ezine Peynir, Süzme Peynir. Beyaz Peynir, Otlu Peynir, Taze Kaşar, Domates, Salatalık, Biber, Söğüş Tabağı, Çilek Reçeli, Vişne Reçeli, Kaymak, Çikolata, Zeytin Çeşitleri, Pişi, Baharatlı Patates, Sosis, Tereyağı, Bal, Menemen, Kaygana, Kuymak, Sahanda Sucuklu Yumurta, Çay."),
        ("Sahanda Yumurta", 250, "Sucuklu"),
        ("Kuymak", 270, "Mısır unu, kuymak peyniri ve tereyağ ile hazırlanır."),
        ("Menemen", 250, "Domates, biber ve yumurta ile hazırlanır."),
        ("Kaşarlı Omlet", 220, "Beyaz peynir ve kaşar peyniri ile hazırlanıp; yanında domates, salatalık ve cips ile servis edilir."),
        ("Karışık Omlet", 250, "Sucuk, salam, yeşilbiber ve kaşar peyniri ile hazırlanıp; yanında domates, salatalık ve cips ile servis edilir."),
        ("Sigara böreği", 230, "Domates ve salatalık ile servis edilir."),
        ("Paçanga böreği", 240, "Domates ve salatalık ile servis edilir."),
        ("Sıcak Sepeti", 320, ""),
    ]),
    ("Çorbalar", [
        ("Karalahana Çorbası", 200, "Kara Lahana, barbunya fasulyesi, mısır yarması, pul biber, salça, kuru soğan"),
        ("Günün Çorbası", 150, ""),
    ]),
    ("Tostlar", [
        ("Bazlamalı Köy Tostu", 300, "Bazlama ekmeği, acuka, köy peyniri, domates, kaşar peyniri, yoğurtlu sos, baharatlı patates, turşu, yeşillik"),
        ("Palet Special Tost", 320, "Bazlama ekmeği, sucuk, kaşar, acuka, cheddar peyniri, baharatlı patates yanında rus salatası ile servis edilir."),
        ("Sebzeli Yumurtalı Tost", 310, "(Kepekli ekmek isteğe bağlı) Bazlama ekmeği, yumurta, sucuk, kaşar, domates, biber, kıtır patates yanında acı sos ve rus salatası ile servis edilir."),
        ("Naturel Tost", 300, "Bazlama ekmeği, sucuk, salam, kaşar, turşu, domates, baharatlı patates, akdeniz yeşillikleri yanında rus salatası ile servis edilir."),
        ("Pizza Tost", 320, "Bazlama ekmeği içerisinde kaşar, sosis, sucuk, mantar, biber, zeytin, domates ve özel sos yanında patates ve rus salatası ile servis edilir."),
    ]),
    ("Gözlemeler", [
        ("Peynirli Gözleme", 320, "Peynirli maydonozlu gözleme. Patates kızartması domates ve salatalık ile servis edilir."),
        ("Patatesli, Kaşarlı Gözleme", 320, "Patates kızartması domates ve salatalık ile servis edilir."),
        ("Kaşarlı Gözleme", 320, "Patates kızartması domates ve salatalık ile servis edilir."),
        ("Kıymalı Gözleme", 350, "Kıyma ve kaşar ile birlikte hazırlanıp yanında domates salatalık ve patates cipsi ile servis edilir."),
    ]),
    ("Kaseler", [
        ("Tavuklu Meksika Kase", 490, "Izgara tavuk, haşlanmış siyah fasülye, sote mısır soğan biber karışımı, Basmati pirinç, üzerinde az miktarda cheddar"),
        ("Somonlu Omega-3 Kase", 500, "Izgara somon, Basmati pirinç, buharda brokoli ve havuç, trup, susam serpiştirilmiş avokado soya ve limon sosu"),
        ("Izgara Tavuk Kase", 490, "Izgara tavuk, haşlanmış kinoa, nohut, roka, salatalık, cherry domates, ince doğranmış mor lahana, avokado, zeytinyağı ve limon ile servis edilir."),
        ("Bonfile Kase", 570, "Izgara bonfile, haşlanmış kinoa, nohut, roka, salatalık, cherry domates, ince doğranmış mor lahana, avokado dilimi, zeytinyağı ve limon ile servis edilir."),
        ("Falafel Kase", 450, "Falafel topları, kinoa, roka, brokoli, çeri domates, salatalık, mor lahana, avokado, yoğurtlu sos ile servis edilir."),
        ("Köfte Kase", 500, "Basmati pirinç, sade köfte, mor lahana, börülce fasulyesi, kızarmış ekmek, közlenmiş biber, domates, yoğurtlu sebze salatası ile servis edilir."),
        ("Çıtır Tavuk Kase", 490, "Çıtır tavuk dilimleri, salatalık, mor lahana, avokado, çeri domates, haşlanmış sebzeler, nohut ve roka ile servis edilir."),
    ]),
    ("Salatalar", [
        ("Tavuklu Salata", 400, "Kurutulmuş domates, marul, salatalık, havuç, cheddar peyniri, kuroton, balzemik sızma yağı, baharatlı piliç dilimleri, nar ekşisi"),
        ("Çıtır Tavuklu Salata", 400, "Taze marul, domates kurusu, salatalık, havuç, kuroton, parmesan, çeri domates, baharatlı kremalı sos, nar ekşisi, çıtır tavuk dilimleri ile"),
        ("Sezar Salata", 400, "Izgara tavuk dilimleri, taze marul, domates, salatalık, mısır, kuroton, parmesan peyniri, sezar sos ile"),
        ("Kekik Soslu Akdeniz Salata", 320, "Taze marul, havuç, roka, domates, salatalık, dilim zeytin, beyaz peynir, kırmızı lahana, zeytinyağlı kekikli sos, nar ekşisi"),
    ]),
    ("Sandviçler", [
        ("Amerikan Sandviç", 300, "Sandviç ekmeği içerisinde dana salam, kaşar peyniri, kornişon turşu, domates, yeşillikler, rus salatası, patates"),
        ("Schnitzel Sandviç", 400, "Sandviç ekmeği içerisinde mayonez, ketçap, cheddar peyniri, turşu, akdeniz yeşillikleri, patates, acı sos"),
        ("Biftekli Sandviç", 500, "Sandviç ekmeği içerisinde biftek parçaları, mayonez, turşu, domates, eritme peyniri, patates, acı sos, hardal sos"),
    ]),
    ("Makarnalar", [
        ("Fettuccine Makarna", 410, "Kültür mantarı, kızarmış tavuk dilimleri, parmesan peyniri, kremalı sos"),
        ("Körili Penne", 410, "Tavuk ve mantar dilimleri, penne makarna, krema, köri sosu ve parmesan ile servis edilir."),
        ("Penne Arabiata", 400, "Dilim siyah zeytin, biber dilimleri, domatesli acı sos, parmesan maydanoz"),
        ("Biftekli Linguine (Krem Soslu)", 450, "Spagetti makarna, kültür mantarı, biftek dilimleri, parmesan peyniri, yaprak maydanoz dalları"),
        ("Penne Palette", 400, "Brokoli, dana janbon, mısır, krema, parmesan peyniri, karabiber, fesleğen, maydanoz"),
        ("Izgara Bonfile Penne Palet", 450, "Penne makarna, kremalı ızgara bonfile üstüne parmesan ve maydanoz ile servis edilir."),
        ("Izgara Tavuklu Fettuccine", 400, "Fettucine makarna, krema üstüne ızgara tavuk, parmesan ve maydanoz ile servis edilir."),
    ]),
    ("Burgerler", [
        ("Çıtır Tavuklu Burger", 400, "Hamburger ekmeği, çıtır tavuk, domates, turşu, baharatlı patates"),
        ("Mangalda Tavuk Burger", 400, "Hamburger ekmeği, piliç, taleks, cheddar peyniri, marul, turşu, domates, rus salatası, baharatlı patates"),
        ("Klasik Burger", 460, "Hamburger ekmeği içerisinde köfte, marul, turşu, domates ile hazırlanıp yanında kızarmış patates, rus salatası ve acı sos ile servis edilir."),
        ("Palet Burger", 590, "Dana köfte, dana biftek, cheddar peyniri, marul, turşu, domates, rus salatası, baharatlı patates"),
        ("B.B.Q Köfteci Burger", 470, "Burger ekmeği, dana köfte, Akdeniz yeşillikleri, kornişon turşu, domates, kıtır baharatlı patates, cheddar peyniri, B.B.Q sos"),
        ("Double Mangalda Burger", 500, "Burger ekmeği, dana köfte, tereyağlı, Akdeniz yeşillikleri, kornişon turşu, acı sos, kıtır baharatlı patates, rus salatası"),
    ]),
    ("Wrap", [
        ("Sebzeli Tavuklu Wrap", 450, "Sotelenmiş jülyen tavuk dilimleri, mantar, biber çeşitleri, eritme kaşar, barbekü sos ve patates ile servis edilir."),
        ("Chef Palet Special", 490, "Tortilla lavaşı, tavuk parçaları, renkli biber, mantar, kaşar peyniri, baharatlı patates, yoğurt ve barbekü sos ile servis edilir."),
        ("Tavuklu Wrap", 470, "Kızartılmış yufka içerisinde tavuk ve mantar dilimleri, kaşar peyniri, napoliten sos ile hazırlanıp yanında patates ve Akdeniz yeşillikleri ile süslenir."),
    ]),
    ("Kırmızı Etler", [
        ("Bonfile Fajita", 900, "Jülyen bonfile dilimleri, karamelize soğan ve kapya biber, köy biberi, jalapeno biber, Meksika fasulyesi, lavaş ve özel soslarla servis edilir."),
        ("Mangalda Lokum Bonfile", 960, "Baharatlı dilim etler, ızgara soğan, mantar, biber, patates püresi, taze yeşillikler, közlenmiş patlıcanlı tarator sos ile"),
        ("Palet Usulü Yoğurtlu Çökertme", 900, "Dilim bonfile parçaları, kibrit patates, süzme yoğurt, lavaş, tereyağ, domates sos ile"),
        ("Mangalda Dana Antrikot", 950, "Marine edilmiş dilim etler, taze yeşillikler, patates püresi, közlenmiş biber, patlıcanlı sos ile"),
        ("Sac Kavurma", 920, "Dana ve kuzu eti, soğan biber, domates, sarmısak, karabiber, kekik, pilav ve patates ile"),
        ("Mangalda Köfte", 800, "Dana köfte, ızgara soğan, biber, domates, yoğurtlu patlıcan sos, pilav patates ile"),
        ("Fırınlanmış Antrikot", 950, "Kremalı mantarlı makarna, fırınlanmış antrikot yanında sebze sote ve özel sos servis edilir."),
    ]),
    ("Beyaz Etler", [
        ("Tavuk Fajita", 500, "Jülyen tavuk dilimleri, karamelize soğan ve kapya biber, köy biberi, jalapeno biber, Meksika fasulyesi, özel soslar ve lavaş ile servis edilir."),
        ("Köri Soslu Tavuk", 500, "Jülyen tavuk dilimleri, krema, köri sos, pilav, patates kızarması ile servis edilir."),
        ("Tiryaki Soslu Tavuk", 500, "Sotelenmiş piliç bagetleri, yeşil soğan, susam, tiryaki sos, soya sosu, pilav ve roka ile servis edilir."),
        ("Piliç Çökertme (Palet Usulü)", 520, "Jülyen tavuk dilimleri, kibrit patates, süzme yoğurt, lavaş, domates sos, tereyağlı, maydanoz yaprakları"),
        ("Mangalda Piliç Izgara", 500, "Baharatlarla marine tavuk dilimleri, ızgara soğan, domates, biber, közlenmiş patlıcan, yoğurt, sos, pilav, taze yeşillikler, salata sos ile"),
        ("Tavuk Schnitzel", 500, "Panelenmiş piliç göğüsleri, patates salatası, tereyağı, roka, krema, sos ile"),
        ("Barbekü Soslu Piliç", 500, "Sotelenmiş jülyen tavuk, mantar, barbekü sos, pilav ve patates ile servis edilir."),
        ("Barbekü Soslu Piliç Kavurma", 500, "Sulanmış soğan, biberler, domates ve piliç parçaları, soya ve barbekü sosu, pilav ve kıtır patates ile servis edilir."),
        ("Tavuk Polenta", 500, "Jülyen tavuk dilimleri, kapya biber, köy biberi, napoliten sos; sote altına yoğurtlu patlıcanlı sos yanında pesto soslu kremalı makarna ve salata ile servis edilir."),
    ]),
]

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# Kaşüstü şubesini bul
c.execute("SELECT id, slug, name FROM branches")
branches = c.fetchall()
print("Tüm şubeler:")
for b in branches:
    print(f"  id={b['id']} slug={b['slug']}")

target = None
for b in branches:
    if b['slug'] == 'yomra-sube':
        target = b
        break
if not target:
    print("\nyomra-sube bulunamadı! Slug listesine bakın.")
    conn.close()
    raise SystemExit()

branch_id = target['id']
print(f"\nHedef şube: id={branch_id}, slug={target['slug']}\n")

for sort_order, (cat_name, products) in enumerate(MENU):
    # Kategoriyi bul veya oluştur
    c.execute("SELECT id FROM categories WHERE branch_id = ? AND name = ?", (branch_id, cat_name))
    row = c.fetchone()
    if row:
        cat_id = row['id']
        c.execute("UPDATE categories SET sort_order = ? WHERE id = ?", (sort_order, cat_id))
        print(f"Kategori güncellendi: '{cat_name}'")
    else:
        slug = make_slug(cat_name, branch_id)
        c.execute("INSERT INTO categories (branch_id, name, slug, sort_order) VALUES (?, ?, ?, ?)",
                  (branch_id, cat_name, slug, sort_order))
        cat_id = c.lastrowid
        print(f"Kategori oluşturuldu: '{cat_name}'")

    # Mevcut ürünleri sil, sıfırdan ekle
    c.execute("DELETE FROM products WHERE category_id = ?", (cat_id,))
    for prod_order, (name, price, desc) in enumerate(products):
        c.execute("INSERT INTO products (category_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?)",
                  (cat_id, name, desc, price, prod_order))
    print(f"  {len(products)} ürün eklendi")

conn.commit()
conn.close()
print("\nTamamlandı.")
