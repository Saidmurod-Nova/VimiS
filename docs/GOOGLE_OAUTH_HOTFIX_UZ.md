# Vimi Google OAuth hotfix (Supabase)

## Nima sababdan ishlamagan bo‘lishi mumkin?
- Stage 2 kodida `@supabase/supabase-js` import qilingan, lekin `package.json` dependency ro‘yxatiga kiritilmagan edi.
- `.env.example` da `VITE_AUTH_PROVIDER=base44` bo‘lsa, Google tugmasi Base44 loginini chaqiradi, Supabase OAuth’ni emas.

## O‘rnatish
1. Ushbu arxivni Vimi loyihasining nusxasiga oching; original loyihani backup qiling.
2. `.env.local` ichida quyidagilarni tekshiring (qiymatlarni o‘zingiz kiriting):
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   VITE_AUTH_PROVIDER=supabase
   ```
3. Terminalda `npm install` bajaring. Bu Supabase SDK’ni o‘rnatadi va package-lock faylini yangilaydi.
4. Vite dev serverini to‘xtatib, qayta ishga tushiring: `npm run dev`.
5. Supabase Dashboard → Authentication → URL Configuration’da `http://localhost:5173/**` redirect URL sifatida ruxsat etilganini tekshiring. Google Cloud’dagi OAuth client uchun Supabase ko‘rsatgan callback URL aynan Authorized redirect URIs ichida bo‘lsin.
6. Login sahifasida Google bilan kirishni sinang.

## Muhim cheklov
`VITE_AUTH_PROVIDER=supabase` Vimi autentifikatsiyasini Supabase’ga o‘tkazadi. Mahsulot/savat/buyurtma kabi backend amallari hali Base44’dan to‘liq migratsiya qilinmagan bo‘lsa, ular xato berishi mumkin. Bu hotfix Google Auth’ni ulash va tekshirish uchun; production’ga tayyorlik tasdig‘i emas.

Hech qachon `service_role`, secret key yoki Google Client Secret’ni frontend `.env.local` ichiga kiritmang. Google Client Secret faqat Supabase Dashboard’da saqlanadi.
