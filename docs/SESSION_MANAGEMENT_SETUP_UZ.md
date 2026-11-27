# Qurilma va session boshqaruvi

Session boshqaruvi Supabase Auth rejimida ishlaydi (`VITE_AUTH_PROVIDER=supabase`). Foydalanuvchilar o‘z hisobidagi faol qurilmalarni ko‘rishi va boshqa qurilmalardagi sessionlarni bekor qilishi mumkin.

## Deploy

1. Supabase loyihasida yangi 32-byte (64 ta hex belgi) kalit yarating. Kalitni repoga yoki frontend `.env` fayliga qo‘shmang.
2. Kalitni Supabase Edge Function secret sifatida `VIMI_SESSION_ENCRYPTION_KEY` nomi bilan saqlang. U qurilmalar refresh tokenlarini AES-GCM bilan shifrlash uchun ishlatiladi.
3. `supabase db push` orqali `202610210001_qr_session_auth.sql` migrationini va keyingi cleanup migrationlarini qo‘llang.
4. `supabase functions deploy qr-session` orqali sessionlarni boshqaradigan Edge Function'ni deploy qiling.

Edge Function'da Supabase tomonidan beriladigan `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` qiymatlari bo‘lishi kerak. Service-role kalitini hech qachon brauzerga yubormang.

## Ishlash tartibi

- Session ma’lumotlari hisobga ulangan qurilmalarni ko‘rsatish uchun saqlanadi.
- Mavjud sessionlarning refresh tokenlari faqat AES-GCM bilan shifrlangan ko‘rinishda saqlanadi. Session revoke qilishdan oldin token serverda yangilanadi va Supabase Admin API orqali aynan shu qurilma sessioni bekor qilinadi.
- “Boshqalarini chiqarish” joriy qurilmani saqlab, qolgan sessionlarni bekor qiladi.

## Muhim

`VIMI_SESSION_ENCRYPTION_KEY` yo‘qolsa yoki almashtirilsa, avval shifrlangan refresh tokenlarni ochib bo‘lmaydi; foydalanuvchilar tegishli sessionlarni qaytadan ochishi kerak bo‘ladi. Kalitni zaxiralang va almashtirishni boshqariladigan rotatsiya sifatida bajaring.

Supabase sessiyasining access tokeni JWT muddati tugaguncha ishlashi mumkin. Supabase refresh tokenni revoke qilgach, boshqa qurilma refresh qila olmaydi; access token uchun loyihada sozlangan JWT expiry amal qiladi.
