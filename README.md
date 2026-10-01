# Orhun — WordPress REST API frontend

Next.js / TypeScript ile oluşturulan, Uygurca RTL yayın arayüzü. İçerikler doğrudan mevcut WordPress sitesinden gelir; örnek içerik veya ayrı veritabanı kullanılmaz.

## Çalıştırma

```sh
npm install
npm run dev
```

Yerel adres: http://localhost:3000/uy

`.env.example` yapılandırma örneğidir. Varsayılan WordPress adresi `https://orhunpolicycenter.com/uy`; üretimde `NEXT_PUBLIC_SITE_URL` yayın adresine ayarlanmalıdır.

## Mevcut işlevler

- Ana sayfa: en yeni yazılar, bölgeler ve kitap tanıtımı.
- Arama: `/uy?q=...`; sonuç sayfalama.
- Kategori ve makale adresleri WordPress'in mevcut `/uy/...` URL yapısını korur.
- Hakkımızda, iletişim ve öneri sayfaları API üzerinden okunur. Form eklentileri henüz ayrı arayüze entegre edilmedi.
- Makale HTML'i temizlenir; site içi içerik bağlantıları yeni arayüze yönlendirilir.
- Kapak görseli yoksa içerikteki ilk görsel kullanılır.
- Uygurca font mevcut siteden alınmıştır; yayın öncesinde lisansı doğrulanmalıdır.
- İngilizce ve Latin Uygurca bağlantıları mevcut sitedeki sürümlere gider. Yeni arayüz şu an `/uy` sürümüdür.
- API verisi sunucuda alınır ve 120 saniye önbelleğe alınır. Ağ hatalarında hata ekranı gösterilir.

## API incelemesi (1 Ekim 2026)

- `GET https://orhunpolicycenter.com/uy/wp-json/`: WordPress API keşfi.
- `GET .../wp/v2/posts?per_page=12&_embed`: yazılar, yazarlar ve kategoriler; toplam 83 yazı.
- `GET .../wp/v2/categories?per_page=100`: 19 kategori.
- `GET .../wp/v2/pages?per_page=100`: 3 sayfa.
- Özel `/ughtr/v1/posts` endpoint'i de var; standart API üzerinden tüm güncel yazılar erişilebilir olduğundan kullanılmadı. Bu endpoint'in adı tek başına dönüşüm veya dil eşleştirme desteğini doğrulamıyor.
- Boş rapor/kurs kategorileri için sahte içerik üretilmez.
- `X-WP-Total` ve `X-WP-TotalPages` başlıkları sayfalama için kullanılır.

## Kontrol

```sh
npm test
npm run typecheck
npm run build
```

## Üretime geçişte kalan işler

WordPress yönetim paneline ihtiyaç duymadan açık içerikler ve arayüz geliştirildi. Canlıya geçiş için domain/yönlendirme yapılandırması, taslak önizleme yetkilendirmesi, anlık güncelleme webhook'u, dil sürümlerinin entegrasyonu ve mevcut yorum/form eklentilerinin bağlantısı ayrıca yapılmalıdır. Mevcut canlı WordPress sitesi değiştirilmedi.
