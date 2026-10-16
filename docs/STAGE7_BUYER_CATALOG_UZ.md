# Vimi Supabase migratsiyasi — 7-bosqich

## Qamrov
- Ommaviy kategoriyalarni olish.
- Ommaviy do‘kon va mahsulot qidiruvi.
- Filial katalogi: mahsulot, mavjudlik, qoldiq va filial narxi.
- Xaridorning Home, Search, Store, BranchProducts va ProductDetail sahifalarida `VITE_AUTH_PROVIDER=supabase` bo‘lgandagina Supabase o‘qish yo‘li.
- `base44` rejimi default bo‘lib qoladi; bu stage checkout, cart yoki BuyerContext migratsiyasi emas.

## Kerakli sozlamalar
`.env.local` da:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_AUTH_PROVIDER=base44
```

`VITE_AUTH_PROVIDER=supabase` ni faqat Supabase Auth, cart, BuyerContext, favorites/saved stores va checkout migratsiyasi ham sinovdan o‘tgach yoqing. Hozircha Base44 rejimini saqlash xavfsizroq.

## Sinov
1. Supabase’da schema migration 002 bajarilganini tekshiring.
2. `npm install` va `npm run build` bajaring.
3. Supabase Table Editor’da `categories`, `businesses`, `branches`, `products`, `branch_inventory` jadvallarida mos yozuvlar borligini tekshiring.
4. Public o‘qish RLS siyosatlari anon va authenticated uchun kutilgan natijani berishini tekshiring.
5. Test biznes va filial bilan Home, Search, Store, BranchProducts, ProductDetail sahifalarini tekshiring.

## Cheklovlar
- Bu migratsiya Base44 ma’lumotlarini import qilmaydi.
- Savatga qo‘shish hanuz `CartContext` orqali Base44 backend’iga bog‘liq bo‘lishi mumkin.
- BuyerContext (saved stores, favorites, visit history) hanuz to‘liq Supabase’ga ko‘chmagan.
- Build va live Supabase testlari ushbu arxivni tayyorlash muhitida bajarilmagan.
