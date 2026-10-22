# Vimi — Supabase Storage va Google OAuth sozlash

## Hozirgi holat
- `src/lib/supabase.js`: Supabase browser client.
- `src/lib/supabaseStorage.js`: JPG/PNG/WebP, 5 MB gacha bo'lgan rasmlarni `vimi-public` bucket'iga yuklash yordamchisi.
- `src/lib/supabaseOAuth.js`: Google OAuth boshlash yordamchisi.
- `supabase/migrations/202610130001_storage_vimi_public.sql`: Storage bucket va RLS siyosatlari.

**Muhim:** Vimi'ning hozirgi login/context va ko'plab backend funksiyalari Base44'ga bog'langan. Shu sababli Google OAuth tugmalarini hozircha Supabase'ga almashtirmadik: shunchaki almashtirish login'dan keyin himoyalangan sahifalar va backend amallarini buzadi. Supabase Auth to'liq migratsiya qilingach, `Login.jsx`, `Register.jsx`, `AuthContext.jsx` va backend funksiyalar birgalikda almashtiriladi. Xuddi shunday, Storage upload UI ham Supabase sessiyasi tayyor bo'lgach ulanadi.

## 1. Project qiymatlari
1. Supabase Dashboard → Project Settings → API.
2. Project URL'ni `VITE_SUPABASE_URL` ga kiriting.
3. Publishable key (yoki eski `anon` public key) ni `VITE_SUPABASE_PUBLISHABLE_KEY` ga kiriting.
4. `service_role` yoki `secret` key'ni frontendga hech qachon qo'ymang.
5. Vite serverni qayta ishga tushiring (`npm run dev`).

## 2. Storage bucket
1. Supabase Dashboard → SQL Editor.
2. `supabase/migrations/202610130001_storage_vimi_public.sql` ichidagi SQL'ni ishga tushiring.
3. Bucket nomi `vimi-public`. U public rasmlarni ko'rsatadi, lekin upload/delete faqat login qilgan foydalanuvchining o'z UUID papkasiga ruxsat etadi.
4. Fayllar: JPG, PNG, WebP; maksimum 5 MB.

## 3. Google OAuth provider
1. Google Cloud Console'da OAuth consent screen sozlang.
2. OAuth Client ID turini **Web application** qiling.
3. Supabase Dashboard → Authentication → URL Configuration'dan `https://<PROJECT_REF>.supabase.co/auth/v1/callback` callback URL'ni nusxalang va Google Cloud Console'dagi Authorized redirect URIs qismiga qo'shing.
4. Google Cloud Console'dan Client ID va Client Secret'ni oling; Supabase Dashboard → Authentication → Providers → Google'da kiriting va yoqing.
5. Supabase Authentication → URL Configuration'da `Site URL` ni ishlab turgan domeningizga qo'ying. Lokal ishlab chiqish uchun Redirect URLs ro'yxatiga `http://localhost:5173/**` qo'shing. Ishlab chiqarish domenini ham qo'shing.
6. Client Secret'ni `.env.local` yoki frontend kodiga qo'ymang; u faqat Supabase Dashboard'da saqlanadi.

## 4. OAuth helper
`src/lib/supabaseOAuth.js` ichidagi `signInWithGoogleSupabase(returnTo)` funksiyasi tayyor. Uni Login/Register sahifalariga faqat Supabase Auth'ga to'liq o'tgandan keyin ulang.

## 5. Tekshiruv
- `.env.local` qiymatlari haqiqiy bo'lishi kerak; placeholder bilan ishlamaydi.
- SQL Editor'da migration xatosiz bajarilgan bo'lishi kerak.
- Google provider enabled bo'lishi kerak.
- OAuth testidan oldin Supabase Auth callback va redirect URL'lar mos bo'lishi kerak.
