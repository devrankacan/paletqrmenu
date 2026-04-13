#!/usr/bin/env python3
"""
Scraper for palet.dijital.menu - extracts products and prices.
"""
import json
import asyncio
import re
from playwright.async_api import async_playwright


async def scrape_menu():
    url = "https://palet.dijital.menu"
    results = {"categories": [], "products": []}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
        )

        # Intercept API calls
        api_responses = []

        async def handle_response(response):
            if "api" in response.url or "menu" in response.url or "product" in response.url or "category" in response.url:
                try:
                    data = await response.json()
                    api_responses.append({"url": response.url, "data": data})
                    print(f"[API] {response.url}")
                except Exception:
                    pass

        page = await context.new_page()
        page.on("response", handle_response)

        print(f"Fetching {url} ...")
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(f"Warning: {e}")

        await page.wait_for_timeout(3000)

        # Print intercepted API calls
        if api_responses:
            print(f"\nFound {len(api_responses)} API response(s):")
            for r in api_responses:
                print(f"  URL: {r['url']}")

        # Try to extract from the page DOM
        content = await page.content()

        # Try to find __NEXT_DATA__ or similar embedded JSON
        next_data_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', content, re.DOTALL)
        if next_data_match:
            try:
                next_data = json.loads(next_data_match.group(1))
                print("\n[INFO] Found __NEXT_DATA__ embedded JSON")
                results["next_data"] = next_data
            except Exception as e:
                print(f"[ERROR] Failed to parse __NEXT_DATA__: {e}")

        # Extract categories
        categories = await page.query_selector_all("[class*='category'], [class*='Category'], [data-category]")
        for cat in categories:
            text = await cat.inner_text()
            if text.strip():
                results["categories"].append(text.strip())

        # Extract products with prices - try various selectors
        price_selectors = [
            "[class*='price']",
            "[class*='Price']",
            "[class*='fiyat']",
            "[class*='product']",
            "[class*='Product']",
            "[class*='item']",
            "[class*='menu-item']",
        ]

        seen = set()
        for selector in price_selectors:
            items = await page.query_selector_all(selector)
            for item in items:
                try:
                    text = await item.inner_text()
                    text = text.strip()
                    # Check if it contains a price-like pattern (number + currency)
                    if text and (re.search(r'\d+[\.,]\d*\s*[₺TL$€]', text) or re.search(r'[₺TL$€]\s*\d+', text)):
                        if text not in seen:
                            seen.add(text)
                            results["products"].append(text)
                except Exception:
                    continue

        # Try to get all text with prices on the page
        page_text = await page.evaluate("""
            () => {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                const texts = [];
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text && /\\d/.test(text)) {
                        texts.push(text);
                    }
                }
                return texts;
            }
        """)

        # Filter for price-like text
        price_texts = [t for t in page_text if re.search(r'[\d]+[\.,]?\d*\s*[₺TL]', t)]
        results["price_texts"] = price_texts[:50]

        # Try to get structured product data from the page
        structured = await page.evaluate("""
            () => {
                const products = [];
                // Look for common menu structures
                const cards = document.querySelectorAll(
                    '[class*="card"], [class*="product"], [class*="item"], [class*="menu"]'
                );
                cards.forEach(card => {
                    const name = card.querySelector('h1,h2,h3,h4,h5,span[class*="name"],p[class*="name"]');
                    const price = card.querySelector('[class*="price"],[class*="fiyat"],span,p');
                    if (name || price) {
                        products.push({
                            name: name ? name.innerText.trim() : null,
                            price: price ? price.innerText.trim() : null,
                            full: card.innerText.trim().substring(0, 200)
                        });
                    }
                });
                return products;
            }
        """)
        results["structured_items"] = structured[:50]

        await browser.close()

    return results, api_responses


async def main():
    print("=" * 60)
    print("Palet Dijital Menu Scraper")
    print("=" * 60)

    results, api_data = await scrape_menu()

    # Save full results
    with open("menu_data.json", "w", encoding="utf-8") as f:
        json.dump({"results": results, "api_data": api_data}, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)

    if api_data:
        print(f"\nAPI responses captured: {len(api_data)}")
        for r in api_data:
            print(f"\nURL: {r['url']}")
            print(json.dumps(r["data"], ensure_ascii=False, indent=2)[:2000])

    if results.get("categories"):
        print(f"\nKategoriler ({len(results['categories'])}):")
        for cat in results["categories"]:
            print(f"  - {cat}")

    if results.get("products"):
        print(f"\nÜrünler ({len(results['products'])}):")
        for p in results["products"]:
            print(f"  {p}")

    if results.get("price_texts"):
        print(f"\nFiyat içeren metinler ({len(results['price_texts'])}):")
        for t in results["price_texts"][:20]:
            print(f"  {t}")

    if results.get("structured_items"):
        print(f"\nYapılandırılmış öğeler ({len(results['structured_items'])}):")
        for item in results["structured_items"][:20]:
            if item.get("full") and item["full"].strip():
                print(f"  {item['full'][:100]}")

    if results.get("next_data"):
        print("\n__NEXT_DATA__ bulundu - menu_data.json dosyasına kaydedildi.")

    print(f"\nTam veri menu_data.json dosyasına kaydedildi.")


if __name__ == "__main__":
    asyncio.run(main())
