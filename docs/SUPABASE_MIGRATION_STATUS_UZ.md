# Vimi → Supabase migratsiyasi: hozirgi bosqich

## Nima qo‘shildi
- `@supabase/supabase-js` dependency.
- `src/lib/supabase.js`: browser-safe Supabase client (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- `src/lib/supabaseOAuth.js`: Google OAuth boshlash helper’i.
- `src/lib/supabaseStorage.js`: JPG/PNG/WebP rasmlarini `vimi-public` bucket’iga yuklash va o‘chirish yordamchilari.
- `202610130001_storage_vimi_public.sql`: public image bucket, MIME/hajm cheklovi va RLS.
- `202610130002_vimi_schema.sql`: Base44 entity ta’riflariga asoslangan Supabase jadvallari, indekslar, profile trigger va RLS siyosatlari.
- Product image va business logo upload komponentlari `VITE_STORAGE_PROVIDER=supabase` bo‘lgandagina Supabase Storage ishlatadi.

## Hali bajarilmagan (production uchun shart)
1. `Login.jsx`, `Register.jsx`, `AuthContext.jsx`, `ProtectedRoute.jsx` Supabase Auth’ga ko‘chirilmagan. Hozirgi login oqimi Base44 bilan qoladi. Google provider Supabase Dashboard’da yoqilgan bo‘lishi frontend OAuth avtomatik ishlayapti degani emas.
2. 27 ta Base44 backend funksiyasi Supabase RPC/Edge Functions’ga ko‘chirilmagan.
3. `checkout` va `updateOrderStatus` atomik server funksiyalariga ko‘chirilishi kerak. Hozirgi schema mijozdan `orders` yoki `order_items` yozishga ruxsat bermaydi — bu ataylab xavfsiz default.
4. Base44’dan mavjud ma’lumotlarni import qilish migratsiyasi kiritilmagan.
5. Real Supabase loyihasida SQL’ni bajarish, Google OAuth redirect’ini tekshirish, Storage upload testlari va production build hali tasdiqlanmagan.

## Muhim ID va ma’lumotlar eslatmasi
Base44 entity ID’lari matn bo‘lgani uchun app jadvallarının ID’lari `text` formatida. Supabase Auth user ID esa `uuid`; `profiles.id` auth.users’ga bog‘langan. User ID saqlovchi eski entity ustunlari vaqtinchalik `text` bo‘lib qoladi. Bu import paytida eski ID’larni saqlashga yordam beradi.

## Keyingi amaliy ketma-ketlik
1. Supabase SQL Editor’da faqat yangi `202610130002_vimi_schema.sql` migratsiyasini ko‘rib chiqib bajarish. Oldingi Storage migration bajarilgan bo‘lsa, uni qayta bajarish shart emas.
2. Dashboard → Table Editor’da jadvallar yaratilganini tekshirish.
3. Keyin Supabase Auth migratsiyasini bajarish: auth context, login/register, callback/session handling va profile update.
4. Shundan keyin backend funksiyalarni ko‘chirish va UI data-access qatlamini ulash.
5. So‘ng `.env.local` da `VITE_STORAGE_PROVIDER=supabase` qilib, Storage’ni login qilingan user bilan sinash.

## Secret xavfsizligi
`.env.local` bu arxivga kiritilmagan. Frontend’da faqat Project URL va publishable/anon public key bo‘lishi mumkin. `service_role`, secret key, Google Client Secret yoki database parolini hech qachon frontendga qo‘ymang yoki chatga yubormang.


## Stage 2 — Auth UI integratsiyasi (2026-10-13)
- Login sahifasi: Supabase `signInWithPassword` va Google OAuth yo‘li qo‘shildi.
- Register sahifasi: Supabase `signUp`, profil metadata/upsert va email OTP verify/resend yo‘li qo‘shildi.
- AuthContext: `VITE_AUTH_PROVIDER=supabase` bo‘lganda Supabase sessiyasi, auth state listener va `profiles` ma’lumoti ishlatiladi.
- Forgot password: Supabase `resetPasswordForEmail` yo‘li qo‘shildi.
- `VITE_AUTH_PROVIDER=base44` standart holat bo‘lib qoladi. Sababi Buyer/Business/Cart kontekstlari va backend funksiyalar hali Base44 SDK’dan foydalanadi. Supabase auth’ni umumiy ilovada yoqishdan oldin backend/data-access migratsiyasi shart.
- Google provider’ni Supabase Dashboard’da yoqishning o‘zi yetmaydi: Google Client ID/Secret, Supabase callback URL va Auth URL Configuration to‘g‘ri bo‘lishi kerak.
- Build/lint va real OAuth round-trip bu muhitda hali tasdiqlanmagan.
- ResetPassword sahifasiga Supabase recovery-session orqali parol yangilash yo‘li ham qo‘shildi.
