# Google OAuth uchun Supabase sozlash

Ushbu qo‘llanma faqat Supabase Auth orqali Google login ishlatadigan konfiguratsiyani tavsiflaydi. Bu fayl haqiqiy domen/URLlarni yozmaydi; uni Dashboard’da o‘zingizning loyihangiz uchun to‘g‘ri qiymatlarni bilan to‘ldiring.

## 1) Supabase Dashboard sozlamalari

### Site URL
- Mahalliy rivojlanish: `http://localhost:5173`
- Ishlab chiqarish: hostingdagi o‘zingizga tegishli haqiqiy originni kiriting; taxminiy domen ishlatmang.

### Redirect URLs
- Mahalliy: `http://localhost:5173/auth/callback`
- Telefonni bir xil Wi-Fi orqali sinash: kompyuterning LAN IP manzilini ishlating, masalan `http://192.168.1.25:5173/auth/callback`. `127.0.0.1` yoki `localhost` telefonda telefonning o‘zini anglatadi.
- Ishlab chiqarish: `https://<YOUR_REAL_DOMAIN>/auth/callback` (placeholderni o‘zingizning domeningiz bilan almashtiring)

Telefon brauzerida `http://<KOMPYUTER_LAN_IP>:5173` manzilini oching. `npm run dev` Vite'ni barcha tarmoq interfeyslariga bog‘laydi. Supabase Dashboard > Authentication > URL Configuration > Redirect URLs ro‘yxatiga telefon ishlatayotgan aynan shu origin uchun `/auth/callback` manzilini qo‘shing, masalan `http://192.168.1.25:5173/auth/callback`. Lokal Supabase ishlatilsa, shu URL'ni `supabase/config.toml` dagi `auth.additional_redirect_urls` ga ham qo‘shing. LAN IP o‘zgarsa, URL'ni yangilang.

> Callback sahifasi `src/pages/AuthCallback.jsx` va `src/App.jsx` ichida mavjud bo‘lishi kerak. Agar `returnTo` parametrini ishlatsangiz, callback URL o‘zi foydalanuvchini asl sahifaga qaytaradi.

### Google provider
- Supabase Dashboard > Authentication > Providers > Google > Enable
- Client ID va Client Secret kiritiladi
- Google Cloud Console’da OAuth consent screen sozlang va **Authorized redirect URIs** ichiga Supabase Dashboard ko‘rsatgan callback’ni kiriting. Bu Google’dan Supabase’ga qaytish manzili; ilovaning callback manzilini bu ro‘yxatga qo‘ymang:
  - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- Google OAuth client turi **Web application** bo‘lsin. Client ID va Client Secret Supabase Dashboard’dagi Google provider sozlamalariga kiritiladi.
- OAuth consent screen’dagi ilova holati va test users amaldagi Google Cloud sozlamalariga mos bo‘lsin.

Supabase Dashboard > Authentication > URL Configuration bo‘limidagi **Redirect URLs** ro‘yxatiga ilova callback manzillarini kiriting (`/auth/callback`). **Site URL** esa ilovaning asosiy originidir, callback manzilining o‘zi emas.

## 2) Loyiha ichidagi env

```bash
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

`service_role` kaliti browser yoki frontend kodiga kiritilmasligi kerak. Har doim `publishable` kalit ishlating.

## 3) Foydalanuvchi oqimi

1. Login/Register sahifada `signInWithGoogleSupabase()` chaqiriladi.
2. Supabase OAuth redirect brauzer ochgan ayni origin'dagi `/auth/callback` manziliga yo‘naltiriladi. Redirect URL ruxsat ro‘yxatida bo‘lmasa, Supabase Site URL'ga qaytishi mumkin.
3. `AuthCallback` sahifasi sessionni tekshiradi va
   - `supabase.auth.exchangeCodeForSession()` ni ishlatadi, yoki
   - `getSession()` orqali session mavjudligini tekshiradi.
4. Foydalanuvchi `returnTo` parametriga mos sahifaga qaytariladi.

## 4) Xavfsizlik qaydlari

- `returnTo` faqat same-origin yo‘nalish bo‘lishi kerak.
- Browserga `service_role` yoki boshqa secret kiritmang.
- Google OAuth callback va return URL doim toza, aniq same-origin URL bo‘lsin.
- RLS va `auth.uid()` tekshiruvi bazada bajarilishi kerak; frontend faqat session mavjudligini tekshiradi.

## 5) Mahalliy sinov / tasdiq

- `VITE_AUTH_PROVIDER=supabase` bilan boshlang.
- `npm run build` ishlashini tekshiring.
- Login sahifasida Google buttonini bosing; redirect URL to‘g‘ri bo‘lsa, callback ishlaydi.
- Live Google loginni amalda sinamasdan, “ishlaydi” deb xulosa chiqarmang; faqat konfiguratsiya va kod oqimi to‘g‘ri ekanini tasdiqlang.
