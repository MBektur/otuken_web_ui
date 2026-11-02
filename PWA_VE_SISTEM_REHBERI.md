# Ötüken Web — PWA, Mesajlaşma ve Bildirim Sistemleri Rehberi

Bu belge, projeye kazandırılan **PWA (Progressive Web App)** altyapısını, **ilk açılış hızlandırma (performans) optimizasyonlarını**, **mobil parmak zoom engelleme çözümlerini**, **İletişim (Contact) mesaj alma/yönetme mimarisini** ve **yeni yazı yayınlandığında uzaktan Web Push bildirim gönderme süreçlerini** detaylı olarak açıklamaktadır.

---

## İçindekiler
1. [PWA (Progressive Web App) Sistemi](#1-pwa-progressive-web-app-sistemi)
   - [İkonlar ve Çözünürlük Standartları](#ikonlar-ve-çözünürlük-standartları)
   - [Web App Manifest](#web-app-manifest)
   - [Service Worker & Önbellekleme Stratejisi](#service-worker--önbellekleme-stratejisi)
   - [PWA İstemci Kaydı (`PwaProvider`)](#pwa-istemci-kaydı-pwaprovider)
   - [Cihazlara Göre Kurulum Kılavuzu](#cihazlara-göre-kurulum-kılavuzu)
   - [Akıllı Kurulum Bildirimi (Toast)](#akıllı-kurulum-bildirimi-toast)
2. [Sayfa Açılış Hızı ve Performans İyileştirmeleri](#2-sayfa-açılış-hızı-ve-performans-iyileştirmeleri)
3. [Parmakla Yakınlaştırma (Finger / Pinch Zoom) Çözümü](#3-parmakla-yakınlaştırma-finger--pinch-zoom-çözümü)
4. [Hakkında (About) Sayfaları](#4-hakkında-about-sayfaları)
5. [İletişim (Contact) Mesaj Alma ve Yönetim Sistemi](#5-iletişim-contact-mesaj-alma-ve-yönetim-sistemi)
   - [Ziyaretçi Mesaj Gönderim Süreci](#ziyaretçi-mesaj-gönderim-süreci)
   - [Kalıcı Depolama Mimarisi](#kalıcı-depolama-mimarisi)
   - [Yönetici Gelen Kutusu (Admin Messages Panel)](#yönetici-gelen-kutusu-admin-messages-panel)
   - [API Uç Noktaları](#iletişim-api-uç-noktaları)
6. [Uzaktan Web Push Bildirim Altyapısı](#6-uzaktan-web-push-bildirim-altyapısı)
   - [Mimari ve VAPID Standartları](#mimari-ve-vapid-standartları)
   - [Abonelik Süreci](#abonelik-süreci)
   - [Bildirim Gönderim Yöntemleri](#bildirim-gönderim-yöntemleri)
   - [Yönetici Bildirim Paneli (`/uy/settings/push`)](#yönetici-bildirim-paneli-uysettingspush)
   - [Yeni Yazıda Otomatik Bildirim Tetikleme](#yeni-yazıda-otomatik-bildirim-tetikleme)
7. [Yönetici Şifreleri ve Güvenlik](#7-yönetici-şifreleri-ve-güvenlik)
8. [Test ve Doğrulama](#8-test-ve-doğrulama)

---

## 1. PWA (Progressive Web App) Sistemi

Web sitesini bir mobil veya masaüstü uygulama gibi ana ekrana ekleyebilme, tam ekran çalıştırma, çevrimdışı okuma ve bildirim gönderme kabiliyetidir.

### İkonlar ve Çözünürlük Standartları
Yüklenen amblem görseli şeffaf kare oranlama ve yüksek kaliteli Lanczos filtrelemesi ile aşağıdaki boyutlarda üretilmiştir:
* `public/favicon.ico` (48x48 multi-res)
* `public/favicon-32x32.png` & `public/favicon-16x16.png`
* `public/apple-touch-icon.png` (180x180 — iOS ana ekran simgesi)
* `public/icons/icon-192x192.png` (Standart Android & tarayıcı simgesi)
* `public/icons/icon-512x512.png` (Yüksek çözünürlüklü başlatma ekranı simgesi)
* `public/icons/icon-maskable-512x512.png` (Android'in yuvarlak/kare kırpmaları için %15 güvenli alan kenar paylı simge)

### Web App Manifest
* **Dinamik Rota:** `src/app/manifest.ts` (Next.js App Router standart manifest çıktısı)
* **Statik Fallback:** `public/manifest.json`
* **Yapı:**
  * `name`: ئۆتۈكەن سىياسەت تەتقىقات مەركىزى | Ötüken Policy Center
  * `short_name`: ئۆتۈكەن
  * `start_url`: `/uy`
  * `display`: `standalone` (Adres çubuğu olmadan tam ekran native uygulama görünümü)
  * `background_color` & `theme_color`: `#faf7f0`

### Service Worker & Önbellekleme Stratejisi
Dosya: `public/sw.js`
* **Pre-cache (Ön Yükleme):** Uygulama ilk açıldığında ana sayfalar, yazı tipleri (`ukij-tuz.woff2`, `lateef-*.woff2`) ve çekirdek logolar önbelleğe alınır.
* **Statik Varlıklar (Font, CSS, JS, Resimler):** `Cache-First` stratejisi ile doğrudan yerel bellekten sunulur; ağ gecikmesi yaşanmaz.
* **HTML Sayfaları:** `Network-First` stratejisi ile sunulur. Eğer internet bağlantısı yoksa önbellekteki son sayfa gösterilir (Offline fallback).
* **Push ve Bildirim Tıklama Olayları:** Gelen arka plan mesajlarını yakalar ve tıklandığında ilgili makale sayfasına yönlendirir.

### PWA İstemci Kaydı (`PwaProvider`)
Dosya: `src/components/pwa-provider.tsx`
* Sayfa yüklendiğinde Service Worker'ı otomatik kaydeder.
* Tarayıcının `beforeinstallprompt` olayını yakalar ve kurulum butonlarının tetikleyebilmesi için `window.deferredPwaInstallPrompt` nesnesinde saklar.

### Cihazlara Göre Kurulum Kılavuzu
Kullanıcıların uygulamayı nasıl kuracağını anlatan rehber sayfaları:
* **Uygur Arap Alfabesi:** `/uy/install`
* **Uygur Kiril Alfabesi:** `/ug/install`

| İşletim Sistemi / Tarayıcı | Kurulum Adımları |
| :--- | :--- |
| **iPhone / iPad (iOS Safari)** | 1. Safari'de siteyi açın.<br>2. Ekranın altındaki **Paylaş (Share)** simgesine basın.<br>3. Menüyü aşağı kaydırıp **«Ana Ekrana Ekle» (Add to Home Screen)** seçeneğini seçin.<br>4. Sağ üstteki **«Ekle» (Add)** butonuna basın. |
| **Android (Google Chrome)** | 1. Chrome'da siteyi açın.<br>2. Sağ üstteki üç nokta menüsüne veya ekrandaki **«Yükle»** butonuna basın.<br>3. **«Uygulamayı Yükle» (Install App)** seçeneğini onaylayın. |
| **Masaüstü (Chrome / Edge / Safari macOS)** | 1. Adres çubuğunun sağ tarafındaki **«Uygulamayı Yükle» (Install)** simgesine tıklayın.<br>2. Çıkan onay kutusunda **«Yükle»** butonuna basın. Uygulama dock/görev çubuğuna eklenir. |

### Akıllı Kurulum ve Bildirim Yaşam Döngüsü (Toast & State Machine)
Bileşenler: `src/components/pwa-install-toast.tsx` & `src/lib/pwa-utils.ts`
*(Detaylı durum makinesi diyagramı ve kurallar için ayrıca bakınız: [PWA_DURUM_VE_BILDIRIM_REHBERI.md](PWA_DURUM_VE_BILDIRIM_REHBERI.md))*

* **5 Durumlu Yaşam Döngüsü:**
  1. **Yüklemediyse (`NOT_INSTALLED`):** «ئۆتۈكەن ئەپىنى قاچىلاڭ» banner'ı çıkar.
  2. **Yükledi ama Bildirimleri Açmadıysa (`INSTALLED_NO_NOTIFICATIONS_*`):**
     * Tarayıcıda geziyorsa: *"Ötüken uygulamasını yüklediniz, yeni yazılardan haberdar olmak için uygulamaya girip bildirimleri açın"* uyarısı çıkar.
     * Uygulama içindeyse: Ekranı kirletmeden sadece 1 tıkla bildirim açma butonu gösterilir.
  3. **Yükledi ve Bildirime Onay Verdiyse (`INSTALLED_AND_SUBSCRIBED`):** Hiçbir mesaj çıkmaz (tamamen temiz ekran).
  4. **Kaldırdıysa (Uninstallation):** Android (`beforeinstallprompt` ve `getInstalledRelatedApps`) veya iOS'ta 14 gün açılmadığında silindiği algılanır ve sonraki ziyarette tekrar yükleme teklif edilir.
  5. **Daha Sonra Dediyse (`SNOOZED`):** 24 saat boyunca sessize alınır, 24 saat sonra açıldığında tekrar teklif edilir.

---

## 2. Sayfa Açılış Hızı ve Performans İyileştirmeleri

Sitenin ilk açılışındaki bekleme sorununu çözmek için 3 temel mimari müdahale yapılmıştır:

1. **`layout.tsx` İçindeki Bloklayıcı SSR'ın Kaldırılması:**
   * Önceden: `const headerList = await headers();` çağrısı Next.js App Router'ın tüm statik önbelleklemesini devre dışı bırakıyor ve her sayfayı sunucuda baştan derlemeye zorluyordu.
   * Çözüm: `RootLayout` statik hale getirildi. Dil ve yönlendirme (`dir="rtl" / "ltr"`) istemci tarafında `DirectionManager` ve alt düzenler (`UgLayout`) üzerinden dinamik yönetildi. Sayfa sunucu yanıt süresi (TTFB) 50 milisaniyenin altına indi.

2. **WordPress API Beklemesinin Engellenmesi (Cache-First):**
   * Önceden: Sayfa 1 açılırken `getPosts` fonksiyonu yerel veriyi yok sayarak her defasında yavaş harici WordPress REST API'sine istek atıyor ve 2 ila 15 saniye yanıt bekletiyordu.
   * Çözüm: `wordpress.ts` içinde yerel anlık görüntü (`getLocalPosts`) öncelikli hale getirildi. Yerel veri **0 milisaniyede** ekrana basılır. WordPress istek zaman aşımı 15 saniyeden 4 saniyeye düşürüldü.

3. **Gereksiz Harici Font İsteğinin Kaldırılması:**
   * Önceden: `fonts.googleapis.com` üzerinden harici `Lateef` CSS'i çekilmeye çalışılıyor ve ağ gecikmesi oluyordu.
   * Çözüm: Projenin kendi içinde `/public/fonts/` dizininde `lateef-*.woff2` ve `ukij-tuz.woff2` dosyaları zaten bulunduğu için harici font linki kaldırıldı, sadece yerel pre-load kullanıldı.

---

## 3. Parmakla Yakınlaştırma (Finger / Pinch Zoom) Çözümü

Mobil cihazlarda web sayfalarının native uygulama hissini bozan yakınlaşma sorunları şu şekilde çözülmüştür:

1. **iOS Odaklanma Zoomunun Engellenmesi:**
   * iOS Safari, font boyutu `16px`'den küçük olan herhangi bir form girişine (`input`, `textarea`, `select`) tıklandığında ekranı otomatik olarak yakınlaştırır ve düzeni bozar.
   * Çözüm: `globals.css` içine mobil ekranlar için `@media (max-width: 768px)` kuralıyla tüm inputların font boyutu `16px` olarak sabitlendi.

2. **Çift Dokunma Zoom Gecikmesinin Kaldırılması:**
   * CSS'e `touch-action: manipulation;` eklenerek tarayıcının çift dokunmayı beklemesi ve yanlışlıkla zoom yapması engellendi.

3. **Viewport Kısıtlaması:**
   * `src/app/layout.tsx` içine Next.js Viewport API ile `width: "device-width"`, `initialScale: 1`, `maximumScale: 1`, `userScalable: false`, `viewportFit: "cover"` tanımlandı.

4. **Safari Gesture Dinleyicisi:**
   * `PwaProvider` içinde `gesturestart` olayı yakalanarak çok parmaklı kazara yakınlaştırmalar engellendi.

---

## 4. Hakkında (About) Sayfaları

WordPress'teki içeriksiz sayfalar yerine tam editoryal tasarıma sahip kod tabanlı sayfalar üretildi:
* **Uygur Arap Alfabesi:** `/uy/about`
* **Uygur Kiril Alfabesi:** `/ug/about`
* **Özellikler:** Merkezin vizyonu, misyonu, jeopolitik, Orta Asya, insan hakları ve kitap analizi gibi 4 ana araştırma alanı, akademik tarafsızlık ilkeleri ve iletişim çağrısı.
* **Geriye Uyumluluk:** Eski WordPress bağlantıları (`/uy/ھەققىمىزدە/` vb.) otomatik olarak yeni `/uy/about` sayfasına yönlendirilir.

---

## 5. İletişim (Contact) Mesaj Alma ve Yönetim Sistemi

Ziyaretçilerin gönderdiği mesajların kaybolmadan alınması ve yönetilmesi için tam teşekküllü bir mesajlaşma hattı kurulmuştur.

### Ziyaretçi Mesaj Gönderim Süreci
* **Sayfa Adresleri:** `/uy/contact` ve `/ug/contact`
* **Bileşen:** `src/components/contact-form.tsx`
* **Alanlar:** İsim-Soyisim, E-posta adresi, Konu, Mesaj metni.
* Kullanıcı formu doldurup gönderdiğinde `POST /api/contact` API'sine istek atılır ve anında başarı geri bildirimi verilir.

### Kalıcı Depolama Mimarisi
* **Modül:** `src/lib/contact-store.ts`
* **Veritabanı Dosyası:** `src/data/contact-messages.json`
* **Kayıt Yapısı:**
  ```json
  {
    "id": "msg_1793560042009_1lb58",
    "createdAt": "2026-11-01T19:07:22.009Z",
    "name": "ئەلى سىناقچى",
    "email": "eli@example.com",
    "subject": "ماقالە تەكلىپى",
    "message": "ئۆتۈكەن تەتقىقات مەركىزىگە سالام...",
    "isRead": false,
    "userAgent": "Mozilla/5.0 ...",
    "ip": "127.0.0.1"
  }
  ```

### Yönetici Gelen Kutusu (Admin Messages Panel)
Yönetici, gelen mesajları okumak ve yönetmek için geliştirilen yönetim paneline erişebilir:
* **Erişim Adresi:** `http://127.0.0.1:3000/uy/admin/messages`
* **Yönetici Giriş Şifresi:** `otuken2026`
* **Yetenekler:**
  1. **Okunmamış Mesaj Bildirimi:** Sekmede ve üst barda okunmamış mesaj sayısı rozeti görünür (Örn: `كەلگەن ئۇچۇرلار (3)`).
  2. **Mesajı Genişletip Okuma:** Tıklandığında mesaj otomatik olarak "Okundu" statüsüne geçer.
  3. **Okundu / Okunmadı Durum Değiştirme:** Mesajın durumunu tek tıkla değiştirebilme.
  4. **Mesaj Silme:** İstenmeyen veya spam mesajları tek tıkla kalıcı olarak silme.
  5. **Tek Tıkla E-posta ile Yanıtlama:** *"جاۋاب قايتۇرۇش (Email Reply)"* butonuna basıldığında yöneticinin e-posta uygulamasında (Outlook, Apple Mail vb.) alıcı ve konu otomatik doldurularak yanıt penceresi açılır.
  6. **Arama ve Filtreleme:** İsim, e-posta, konu veya mesaj içeriğine göre anında filtreleme.

### İletişim API Uç Noktaları
* `POST /api/contact`: Yeni mesaj kaydeder (Herkese açık).
* `GET /api/contact?secret=otuken2026`: Tüm mesajları listeler (Yönetici yetkisi gerektirir).
* `PATCH /api/contact`: Mesajı okundu/okunmadı olarak günceller.
* `DELETE /api/contact?id={id}&secret=otuken2026`: Mesajı siler.

---

## 6. Uzaktan Web Push Bildirim Altyapısı

Yeni bir yazı veya analiz yayınlandığında, siteye abone olan tüm kullanıcıların telefon veya bilgisayarlarına anında uzaktan bildirim gönderme sistemidir.

### Mimari ve VAPID Standartları
* RFC 8292 Voluntary Application Server Identification (VAPID) standardı kullanılmıştır.
* **VAPID Anahtarları:**
  * Public Key: `BKtNZBLK3SktKj9OCEzNAyPvuEjKVJlmHYRJVNN3QEynCXYmSFkm7_l4egF6Klo4kVBVyc6f7NgRmcxOxtuXIgE`
  * Private Key: `d6Xuelue4PST-l2_CK46UelG3r7bqNiQHx7BLgZBP1U`
  * Subject: `mailto:otuken2025@gmail.com`
* **Kütüphane:** `web-push`

### Abonelik Süreci
1. Ziyaretçi kurulum sayfasındaki (`/uy/install`) veya sitedeki **"يېڭى يازما ئۇقتۇرۇشلىرىنى قوزغىتىش (Bildirimleri Aç)"** butonuna basar.
2. Tarayıcı izin penceresi açılır (`Notification.requestPermission()`).
3. İzin verildiğinde tarayıcı APNs (Apple) veya FCM (Google) sunucularından cihaza özel şifreli bir Push Subscription üretir.
4. Bu abonelik `POST /api/push/subscribe` uç noktasına gönderilerek `src/data/push-subscriptions.json` içine kaydedilir.

### Bildirim Gönderim Yöntemleri

#### Yöntem A: Yönetici Paneli Üzerinden Manuel Gönderim
* **Panel Adresi:** `http://127.0.0.1:3000/uy/settings/push` (veya `https://www.otukenpolicycenter.com/uy/settings/push`)
  *(Not: Eski `/uy/admin/push` adresi de otomatik olarak buraya yönlendirilir)*
* **Giriş Şifresi:** `otuken-push-secret-2026` veya `otuken2026`
* **Adımlar:**
  1. Panel açıldığında kayıtlı aktif abone sayısı gösterilir (Örn: `142 ئۈسكۈنە`).
  2. **Yazı Seçimi:** *"يېڭى ئېلان قىلىنغان يازمىدىن تاللاش"* açılır kutusundan son yazılardan biri seçildiğinde başlık, kısa özet ve URL otomatik doldurulur.
  3. Dilerseniz başlık ve metni kendiniz de özelleştirebilirsiniz.
  4. **«ئۇقتۇرۇشنى بارلىق ئوقۇرمەنلەرگە يوللاش»** butonuna basıldığında bildirim tüm cihazlara dağıtılır.
  5. Başarı raporu ekranda gösterilir (Ulaşan, başarısız olan ve süresi dolduğu için sistemden temizlenen cihaz sayıları).

#### Yöntem B: Yeni Yazı Yayınlandığında Otomatik Gönderim
* Dosya: `src/lib/cache-sync.ts`
* WordPress önbellek senkronizasyonu (`npm run sync-cache` veya cron servisi) çalıştığında yeni bir makale ID'si keşfederse sistem otomatik olarak:
  ```typescript
  broadcastNotification({
    title: newestPost.title,
    body: newestPost.excerpt,
    url: newestPost.link
  });
  ```
  kodunu tetikler ve yöneticinin hiçbir şey yapmasına gerek kalmadan tüm abonelere anında bildirim gider.

#### Yöntem C: Harici Webhook / cURL ile Gönderim
Dış bir sistemden veya WordPress yayınlandığında bir webhook ile doğrudan tetiklenebilir:
```bash
curl -X POST http://127.0.0.1:3000/api/push/send \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: otuken-push-secret-2026" \
  -d '{
    "title": "يېڭى تەتقىقات ماقالىسى",
    "body": "ئۆتۈكەن سىياسەت مەركىزىنىڭ يېڭى تەھلىلىنى ئوقۇڭ.",
    "url": "/uy/yeni-makale-linki"
  }'
```

---

## 7. Yönetici Şifreleri ve Güvenlik

| Yönetim Paneli / İşlev | Güncel URL (`settings`) | Eski URL (`admin` - Yönlendirilir) | Şifre |
| :--- | :--- | :--- | :--- |
| **Podcast & Video Ayarları** | `/uy/settings` | `/uy/admin/settings` | `otuken2026` |
| **Önbellek & Eşitleme (Cache)** | `/uy/settings/cache` | `/uy/admin/cache` | `otuken2026` |
| **Web Push Bildirim Paneli** | `/uy/settings/push` | `/uy/admin/push` | `otuken-push-secret-2026` veya `otuken2026` |
| **Gelen Mesajlar (Contact Inbox)** | `/uy/settings/messages` | `/uy/admin/messages` | `otuken2026` |

---

## 8. Test ve Doğrulama

Sistemin kararlılığı otomatik birim testleri ile korunmaktadır:

```bash
# 1. TypeScript Tip Kontrolü
npm run typecheck

# 2. Otomatik Testleri Çalıştırma (17/17 test)
npm test

# 3. Canlı Üretim Derlemesi (246 sayfa statik SSG)
npm run build
```

*Tüm testler ve üretim derlemesi 0 hata ile başarıyla doğrulanmıştır.*

---

## 9. Vercel Canlı Ortam Kurulumu & Ücretsiz Kalıcı Veritabanı (KV / Upstash)

Canlı ortamda (`https://www.otukenpolicycenter.com`) Vercel sunucusuz (Serverless) mimari ile çalıştığı için, sunucular uyuduğunda aboneliklerin ve iletişim mesajlarının kaybolmaması için kalıcı bir bulut deposu kullanılır.

### Kodun Hibrit (Çift Modlu) Çalışma Mantığı
`src/lib/push-store.ts` ve `src/lib/contact-store.ts` modülleri akıllı adaptörle donatılmıştır:
* **Localhost'ta:** Herhangi bir bulut değişkeni yoksa yerel `src/data/*.json` dosyalarına yazar (Geliştirme için zahmetsizdir).
* **Vercel'de:** `UPSTASH_REDIS_REST_URL` veya `KV_REST_API_URL` tanımlandığı anda, kod otomatik olarak bulut deposuna geçiş yapar. Abone sayısı asla `0`a düşmez ve sunucu 1000 kez yeniden başlasa bile veriler korunur.

### Ücretsiz Veritabanı Kurulumu (2 Alternatif)

#### 1. Yol: Doğrudan Upstash.com'dan Kredi Kartsız Açma (En Kolay & Kesinlikle Ücretsiz)
1. **[upstash.com](https://upstash.com)** adresine gidin ve GitHub hesabınızla tek tıkla giriş yapın (Kredi kartı gerekmez).
2. **"Create Database"** butonuna basın:
   * **Name:** `otuken-db`
   * **Region:** *eu-central-1 (Frankfurt)*
   * **Plan:** **Free ($0)**
3. Oluşturulduktan sonra sayfayı kaydırıp **"REST API"** başlığı altındaki 2 değeri kopyalayın:
   * `UPSTASH_REDIS_REST_URL`
   * `UPSTASH_REDIS_REST_TOKEN`
4. Vercel Dashboard -> **Settings** -> **Environment Variables** bölümüne gidip bu iki değişkeni yapıştırın ve kaydedin.

#### 2. Yol: Vercel Storage Üzerinden Ücretsiz Plan Seçimi
1. Vercel projenizde üstteki **"Storage"** sekmesine gidin.
2. **"Create Database"** -> **"Upstash" (Redis)** seçin.
3. Fiyatlandırma ekranı geldiğinde **"Free" / "Hobby" ($0/mo)** seçeneğini seçin (Vercel'de Upstash günde 10.000 istek ve 256MB'a kadar $0'dır).
4. Projenize bağlayın (Connect). Vercel değişkenleri otomatik tanımlar.

### Vercel Ortam Değişkenleri Tam Listesi

Vercel -> **Settings** -> **Environment Variables** bölümünde bulunması gereken değişkenler:

| Değişken Adı | Değer / Açıklama |
| :--- | :--- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BKtNZBLK3SktKj9OCEzNAyPvuEjKVJlmHYRJVNN3QEynCXYmSFkm7_l4egF6Klo4kVBVyc6f7NgRmcxOxtuXIgE` |
| `VAPID_PRIVATE_KEY` | `d6Xuelue4PST-l2_CK46UelG3r7bqNiQHx7BLgZBP1U` |
| `VAPID_SUBJECT` | `mailto:otuken2025@gmail.com` |
| `PUSH_ADMIN_SECRET` | `otuken-push-secret-2026` |
| `REVALIDATE_SECRET` | `otuken2026` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.otukenpolicycenter.com` |
| `WORDPRESS_URL` | `https://otukenpolicycenter.com/uy` |
| `UPSTASH_REDIS_REST_URL` | Upstash / Vercel KV REST Adresi |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash / Vercel KV REST Yetki Anahtarı |

---

## 10. Yönetim Paneli Sekme Birliği

Yönetim deneyiminin bütünlüğü için tüm ayar sayfalarında 4 temel sekme standartlaştırılmıştır:
1. **پودكاست ۋە سىن تەڭشەكلىرى:** `/uy/settings`
2. **تېز ساقلىغۇچ ۋە ماسقەدەملەش:** `/uy/settings/cache`
3. **ئۇقتۇرۇش ئەۋەتىش (Web Push):** `/uy/settings/push`
4. **كەلگەن ئۇچۇرلار:** `/uy/settings/messages`


