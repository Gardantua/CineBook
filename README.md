# CineBook 🎬📚

**Web Tabanlı Sosyal Kütüphane Platformu**

Kocaeli Üniversitesi Bilgisayar Mühendisliği — Yazılım Laboratuvarı I, Proje II

---

## Proje Hakkında

CineBook, kullanıcıların kişisel film ve kitap kütüphanelerini oluşturabildiği, içerikleri puanlayıp yorumlayabildiği ve sosyal akış üzerinden paylaşım yapabildiği web tabanlı bir platformdur.

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19, React Router v7, Tailwind CSS v4, Vite |
| Backend | Node.js, Express v5 |
| Veritabanı | SQLite (Prisma ORM) |
| Kimlik Doğrulama | JWT (jsonwebtoken), bcryptjs |
| Harici API | TMDb (filmler), Google Books API (kitaplar) |
| E-posta | Nodemailer + Brevo SMTP |

---

## Özellikler

### Kullanıcı Yönetimi
- Kayıt ol (şifre tekrarı doğrulaması dahil)
- Giriş yap / Çıkış yap
- Profil düzenleme (avatar URL, biyografi)
- Şifre sıfırlama (e-posta ile)

### Sosyal Akış (Feed)
- Takip edilen kullanıcıların aktivitelerini görüntüleme
- Aktivite kartları: poster, puan (★★★★☆), yorum özeti
- Göreceli zaman ("3 saat önce", "2 gün önce")
- Sayfalandırma — "Daha Fazla Yükle" butonu
- Aktivitelere beğeni ve yorum yapabilme

### Arama & Keşfet
- Film ve kitap arama (TMDb + Google Books)
- Tür, yıl, minimum puan filtreleme
- **En Popülerler** ve **En Yüksek Puanlılar** vitrin modülleri
- Sonuçlara hızlı kütüphane ekleme

### İçerik Detay
- Film/kitap meta verileri (poster, özet, yıl, tür)
- Platform ortalaması ve toplam oy sayısı
- 1–10 arası puanlama (hover önizlemeli)
- Yorum yap, düzenle, sil
- Özel listeye ekle menüsü
- İzledim / İzlenecek / Okudum / Okunacak butonları

### Kütüphane & Profil
- Sekmeli kütüphane: İzlediklerim, İzlenecekler, Okuduklarım, Okunacaklar
- Özel koleksiyon listeleri oluşturma
- Takip et / Takipten çık
- Gerçek takipçi/takip sayısı
- **Son Aktiviteler** bölümü

---

## Kurulum

### Gereksinimler
- Node.js 18+
- TMDb API Key → [themoviedb.org](https://www.themoviedb.org/settings/api)
- Google Books API Key → [console.cloud.google.com](https://console.cloud.google.com/)

### Backend

```bash
cd backend
npm install

# .env dosyası oluştur
cp .env.example .env
# .env içini doldur (aşağıya bak)

# Veritabanını oluştur
npx prisma migrate dev --name init

# Sunucuyu başlat
node index.js
```

**backend/.env**
```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="gizli_jwt_anahtari"
TMDB_API_KEY="tmdb_api_anahtarin"
GOOGLE_BOOKS_API_KEY="google_books_api_anahtarin"
EMAIL_USER="smtp_kullanici"
EMAIL_PASS="smtp_sifre"
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Uygulama açılır: **http://localhost:5173**
Backend adresi: **http://localhost:3000**

---

## Proje Yapısı

```
CineBook/
├── backend/
│   ├── index.js              # Express sunucu
│   ├── middleware/
│   │   └── auth.js           # JWT doğrulama
│   ├── routes/
│   │   ├── auth.js           # Kayıt, giriş, şifre sıfırlama
│   │   ├── feed.js           # Sosyal akış
│   │   ├── content.js        # İçerik detay, puanlama, yorum
│   │   ├── library.js        # Kütüphane yönetimi
│   │   ├── search.js         # Arama ve keşfet
│   │   ├── social.js         # Beğeni ve yorum
│   │   └── users.js          # Profil ve takip
│   ├── services/
│   │   ├── tmdb.js           # TMDb API servisi
│   │   └── books.js          # Google Books servisi
│   └── prisma/
│       └── schema.prisma     # Veritabanı şeması
│
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.jsx   # Global auth state
        ├── components/
        │   ├── ActivityCard.jsx  # Aktivite kartı
        │   ├── Layout.jsx
        │   └── Navbar.jsx
        └── pages/
            ├── Dashboard.jsx     # Ana sayfa (feed)
            ├── Discover.jsx      # Arama & keşfet
            ├── ContentDetail.jsx # Film/kitap detay
            ├── Profile.jsx       # Kullanıcı profili
            ├── Login.jsx
            ├── Register.jsx
            ├── ForgotPassword.jsx
            └── ResetPassword.jsx
```

---

## Veritabanı Şeması

```
User ──< Follow (many-to-many, self-referential)
User ──< List ──< ListItem
User ──< Review
User ──< Activity ──< ActivityLike
                   └──< ActivityComment
```

---

## API Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/register` | Kayıt ol |
| POST | `/auth/login` | Giriş yap |
| POST | `/auth/forgot-password` | Şifre sıfırlama isteği |
| POST | `/auth/reset-password` | Şifre sıfırla |
| PUT | `/auth/update` | Profil güncelle |
| GET | `/feed` | Sosyal akış (JWT) |
| GET | `/search/multi` | Film + kitap ara |
| GET | `/search/popular` | En popülerler |
| GET | `/search/top-rated` | En yüksek puanlılar |
| GET | `/content/:type/:id` | İçerik detayı |
| POST | `/content/:type/:id/rate` | Puan ver |
| POST | `/content/:type/:id/review` | Yorum yap |
| PUT | `/content/:type/:id/review` | Yorum düzenle |
| DELETE | `/content/:type/:id/review` | Yorum sil |
| GET | `/library/:userId` | Kütüphaneyi getir |
| POST | `/library/add` | Listeye ekle |
| DELETE | `/library/remove` | Listeden çıkar |
| POST | `/library/create` | Özel liste oluştur |
| GET | `/users/search` | Kullanıcı ara |
| GET | `/users/:id` | Profil getir |
| GET | `/users/:id/activities` | Son aktiviteler |
| POST | `/users/:id/follow` | Takip et |
| DELETE | `/users/:id/follow` | Takipten çık |
| POST | `/social/activity/:id/like` | Beğen |
| DELETE | `/social/activity/:id/like` | Beğeniyi geri al |
| POST | `/social/activity/:id/comment` | Yorum yap |

---

## Geliştirici

**Yunus Emre Arı** — Kocaeli Üniversitesi Bilgisayar Mühendisliği
