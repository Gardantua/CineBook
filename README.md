# CineBook

Film ve kitapları aynı yerde takip etmek için geliştirdiğim web uygulaması. Kullanıcılar kendi listelerini oluşturabiliyor, içerikleri puanlayıp yorumlayabiliyor ve birbirlerinin aktivitelerini takip edebiliyor. Kocaeli Üniversitesi Yazılım Laboratuvarı dersi kapsamında çalıştım.

Bu projede kullanıcı, içerik, liste, yorum ve takip ilişkilerini bir veritabanında modellemeye; backend ile React arayüzünü bir araya getirmeye odaklandım.

## Neler var?

- Kayıt, giriş, profil düzenleme ve e-posta ile şifre sıfırlama.
- TMDb üzerinden film, Google Books üzerinden kitap arama.
- İzlediklerim, izleyeceklerim, okuduklarım ve okuyacaklarım listeleri; özel koleksiyonlar.
- Puanlama, yorumlar, kullanıcı takibi ve sosyal aktivite akışı.

Backend: Node.js, Express, Prisma ve SQLite. Frontend: React, Vite ve Tailwind CSS. Giriş için JWT, şifreler için bcrypt kullanılıyor.

## Yerelde çalıştırma

Node.js 22 kullanıyorum. İki ayrı terminal gerekiyor.

```bash
cd backend
npm ci
cp .env.example .env
```

Windows PowerShell'de kopyalama adımı `Copy-Item .env.example .env`. `.env` içindeki JWT anahtarını kendi rastgele değerinle doldur. Film ve kitap araması için ilgili API ayarlarını; şifre sıfırlama için SMTP ayarlarını ekle. SQLite dosya yolu Prisma şemasının bulunduğu klasöre göre çözülür.

```bash
npx prisma generate
node -e "require('node:fs').closeSync(require('node:fs').openSync('prisma/dev.db', 'a'))"
npx prisma db push
npm start
```

Bu repo migration geçmişi içermediğinden yerel deneme veritabanını `db push` ile oluşturuyorum. Üretim ortamında şema değişikliklerinin migration ile yönetilmesi gerekir.

İkinci terminal:

```bash
cd frontend
npm ci
npm run dev
```

Arayüz `http://localhost:5173`, API `http://localhost:3000` adresinde açılır.

## Kodda nereden başlamalı?

- [Veri modeli](backend/prisma/schema.prisma): kullanıcı, içerik listeleri ve sosyal ilişkiler.
- [API başlangıcı](backend/index.js) ve [route'lar](backend/routes): isteklerin işlendiği backend.
- [Arayüz](frontend/src): sayfalar, ortak bileşenler ve giriş durumu.

## Projenin durumu

Bu bir ders projesi ve yerel demo. Bazı yazma endpoint'lerinde kullanıcı kimliği istek gövdesinden alınıyor; bütün işlemler için yetki/sahiplik kontrolü tamamlanmış değil. Arayüzde API adresi de yerel ortama sabitlenmiş durumda. Canlı ürün olarak kullanmadan önce bu alanların ve şifre sıfırlama akışının ayrıca ele alınması gerekir.

Frontend derlemesi `npm run build`, backend kontrolleri `npm test` ile çalıştırılır. Dört backend kontrolü eksik/kısa JWT anahtarının reddini, doğru anahtarın kullanımını, geçersiz token reddini ve dışarı e-posta göndermeden mesaj oluşturmayı sınar. Sunucu JWT anahtarı yapılandırılmadan başlamaz; şifre sıfırlama tokenı kriptografik rastgelelik kullanır. API anahtarları, yerel veritabanı ve `.env` dosyaları repoya dahil edilmez.
