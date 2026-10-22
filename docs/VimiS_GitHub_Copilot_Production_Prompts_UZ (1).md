# VimiS — GitHub Copilot uchun Productionga tayyorlash promptlari

## Qanday ishlatish

- Avval `vimis-supabase-migration-stage7.zip` arxivini ochib, loyihani GitHub repository’ga joylang yoki mavjud repository’da Stage 7 kodini ishlating.
- Har safar **faqat bitta prompt** yuboring. Copilot ishni tugatgach, o‘zgarishlarni ko‘rib chiqing, `git diff` tekshiring va testlardan o‘tkazing. Keyin keyingi promptga o‘ting.
- Copilotga `.env.local`, Supabase secret/service-role key, OAuth client secret yoki boshqa maxfiy qiymatlarni kodga yozishga ruxsat bermang.
- Hozirgi kodda Base44 hali ishlatilayotgan bo‘lishi mumkin. Migratsiyani bosqichma-bosqich qiling; ishlaydigan Base44 yo‘lini o‘chirib yubormang.
- Har bir bosqich oxirida Copilotdan o‘zgartirilgan fayllar, bajarilgan tekshiruvlar, muvaffaqiyatsiz testlar va qo‘lda bajarilishi kerak bo‘lgan Supabase Dashboard sozlamalarini aniq sanashni so‘rang.

---

## PROMPT 0 — Repo auditi va haqiqiy qolgan ishlar ro‘yxati

Sen VimiS loyihasining senior full-stack va Supabase migration muhandisisan. Ushbu repository — Base44’dan Supabase’ga bosqichma-bosqich ko‘chirilayotgan React + Vite ilova. `AGENTS.md`, `README.md`, `package.json`, `src/lib`, `src/api`, `src/contexts` yoki context papkalari, `src/pages`, `supabase/migrations/*` va migration hujjatlarini avval o‘qi.

Vazifa:
1. Base44 SDK, `base44.entities`, `base44.functions`, `base44.auth`, Base44 upload/storage va Base44-specific Vite plugin ishlatiladigan barcha joylarni top.
2. Supabase auth, catalog, business/branch/inventory, cart, addresses, saved/favorite stores, checkout, buyer orders, seller orders/status, notifications, profile, storage bo‘yicha real holatni jadval qilib chiqar: `to‘liq / qisman / yo‘q / tekshirilmagan`.
3. Har bir yo‘l uchun aniq fayl va funksiyalarni ko‘rsat. Hozirgi SQL schema va RLS siyosatlarini frontend kutayotgan maydonlar bilan taqqosla.
4. `npm run build`, `npm run lint`, `npm run typecheck` ishga tushir. Agar dependencies yo‘q bo‘lsa, avval `npm ci`ni sinab ko‘r. Ishlamagan tekshiruvni muvaffaqiyatli deb ko‘rsatma.
5. Kodni hozircha keng ko‘lamda o‘zgartirma. Faqat aniqlangan aniq, xavfli blockerlarni tuzatish zarur bo‘lsa, ularni minimal o‘zgarish bilan tuzat va izohla.
6. Natijada keyingi bosqichlar uchun tartiblangan reja, risklar va acceptance criteria yoz.

Muhim: hech qanday secretni terminal chiqishiga, logga yoki hujjatga chiqarma. `service_role` kaliti browser kodida bo‘lmasligi kerak. Ma’lumotlar migratsiyasi bajarilgan deb taxmin qilma.

---

## PROMPT 1 — Supabase Auth va Google OAuth’ni ishonchli qilish

Repo audit natijalariga va mavjud `src/lib/supabase.js`, `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `App.jsx` hamda auth/context fayllariga asoslanib Supabase Auth oqimini yakunla.

Talablar:
1. `VITE_AUTH_PROVIDER=supabase` bo‘lganda login, signup, logout, session restore, protected route va profile bootstrap faqat Supabase Auth’dan foydalansin. `base44` rejimida eski oqim buzilmasin.
2. Google OAuth uchun `signInWithOAuth({ provider: 'google', options: { redirectTo: ... }})` yoki loyiha versiyasiga mos rasmiy API ishlat. Callback URL loyihaning haqiqiy route tuzilmasiga mos bo‘lsin; callback sahifasi sessionni tiklab, loading/error holatlarini boshqarsin.
3. `onAuthStateChange` subscription komponent unmount bo‘lganda tozalansin. Session mavjud bo‘lmaguncha noto‘g‘ri redirect yoki sahifa chaqnashi bo‘lmasin.
4. Supabase `profiles` yozuvi mavjud bo‘lishi, foydalanuvchi nomi/telefon/avatar maydonlari xavfsiz yangilanishi kerak. Frontend hech qachon `role=admin` kabi imtiyozli maydonlarni o‘zi belgilay olmasin.
5. Xatolar foydalanuvchiga tushunarli o‘zbekcha ko‘rsatilsin; secretlar yoki to‘liq tokenlar UI/loglarda ko‘rinmasin.
6. Google OAuth uchun Dashboard’da qo‘lda sozlanadigan Site URL, Redirect URLs va Google provider talablari `docs/GOOGLE_OAUTH_SETUP_UZ.md` ichida aniq yozilsin. Haqiqiy URL’larni uydirma.
7. Auth’ga tegishli testlar yoki test qilish checklistini qo‘sh.

Qabul mezoni: Base44 auth yo‘li saqlanadi; Supabase auth yo‘li alohida env flag bilan ishlaydi; OAuth callback va logout toza; `npm run build`, lint va typecheck natijalari rost ko‘rsatiladi. Live Google loginni amalda sinamasdan “ishlaydi” deb yozma.

---

## PROMPT 2 — Savat API va CartContext migratsiyasi

Mavjud `CartContext`/cart hook’lari, barcha cart sahifalari va `supabase/migrations/202610130002_vimi_schema.sql` ni tekshir. Supabase rejimida savatni Base44’dan Supabase’ga ko‘chir, eski Base44 rejimini saqla.

Talablar:
1. Yangi `src/lib/supabaseCart.js` yoki mavjud arxitekturaga mos modul yarat. `getOrCreateActiveCart`, `getCart`, `addToCart`, `updateCartItemQuantity`, `removeCartItem`, `clearCart` kabi funksiyalar bo‘lsin.
2. Har bir so‘rov joriy `supabase.auth.getUser()` foydalanuvchisini tekshirsin. `user_id` yoki `created_by_id`ni klient yuborgan qiymatdan ishonchli deb qabul qilma; DB/RLS asosiy himoya bo‘lsin.
3. Bitta cart faqat bitta business + branch uchun bo‘lsin. Boshqa do‘kon/filial mahsuloti mavjud savatga qo‘shilsa, mahsulotni jimgina aralashtirma; UI’dagi mavjud UX’ga mos ravishda savatni almashtirish yoki foydalanuvchidan tasdiq so‘rash oqimini qo‘sh.
4. Quantity musbat integer bo‘lsin; mavjud mahsulot, active status, filialga tegishlilik va ombor qoldig‘i tekshirilsin. Qoldiqni faqat UI tekshiruviga ishonib qo‘yma.
5. CartContext’ning mavjud qaytaradigan API’sini imkon qadar saqla, shunda komponentlar ortiqcha buzilmaydi. Loading, empty, error va optimistic update rollback holatlari bo‘lsin.
6. RLS policy’larni tekshir: foydalanuvchi faqat o‘z cart/cart_items’ini ko‘rsin va o‘zgartirsin. `security definer` funksiyalar kerak bo‘lsa, `search_path`ni xavfsiz o‘rnat, `EXECUTE` huquqlarini chekla.
7. Ikki marta tez bosish/parallel request dublikat yoki noto‘g‘ri quantity keltirib chiqarmasligi uchun unique constraint va kerakli DB atomikligini ishlat.
8. Unit/integration testlar yoki kamida to‘liq manual test checklist qo‘sh.

`VITE_AUTH_PROVIDER=base44` rejimida oldingi savat ishlashi saqlansin. Supabase cart to‘liq ishlamagan paytda Base44 cart’ni olib tashlama. Build/lint/typecheck bajar va natijani qayd et.

---

## PROMPT 3 — Manzillar va BuyerContext (saqlangan do‘konlar, sevimlilar, tashrif tarixi)

Mavjud `BuyerContext`, `AddressEdit`, checkout manzil tanlash sahifalari va `supabase` schema’ni tekshir. Supabase rejimi uchun quyidagilarni migratsiya qil.

Talablar:
1. Address CRUD: ro‘yxatlash, yaratish, tahrirlash, o‘chirish, default manzilni belgilash. `user_id` server-side auth uid bilan mos bo‘lishi shart. Bir foydalanuvchida bir vaqtda faqat bitta default manzil bo‘lishini DB darajasida atomik ta’minla (partial unique index yoki transaction/RPC).
2. `favorite_stores`: qo‘shish, olib tashlash, ro‘yxatlash.
3. `saved_stores`: store ID orqali ulash, saqlangan do‘konlarni ko‘rsatish, `last_visited_at`ni yangilash va do‘konni ro‘yxatdan olib tashlash. Bir foydalanuvchining boshqa foydalanuvchi ma’lumotini o‘zgartirishiga yo‘l qo‘yma.
4. Mavjud BuyerContext API’ni saqla yoki o‘zgarishlarni barcha caller’larda to‘liq yangila. Location/profile sync `profiles.selected_location` bilan mos ishlasin.
5. RLS policies’ni tekshir va kerakli migration SQL yoz. Anon foydalanuvchiga shaxsiy address, favorites, saved stores ochilib ketmasin.
6. Xato/loading/empty holatlari va o‘zbekcha xabarlar bo‘lsin.
7. Base44 fallback’ni saqla.

Testlar: ikki user bir-birining address/favorite/saved store ma’lumotini ko‘ra yoki o‘zgartira olmasligi; default address o‘zgarganda oldingisi bekor bo‘lishi; o‘chirish va qayta qo‘shish; store ID noto‘g‘ri bo‘lganda xato. Build/lint/typecheck bajargin.

---

## PROMPT 4 — Checkout, buyurtma yaratish va zaxira xavfsizligi

Mavjud `supabase/migrations/202610130003_atomic_checkout_order_status.sql`, `CartContext`, checkout sahifalari va order schema’ni to‘liq audit qil. `vimi_checkout` RPC’sini Supabase frontend oqimiga ulang; kerak bo‘lsa SQL migration’ni xavfsiz yangi migration sifatida tuzat.

Talablar:
1. Checkout client’dan order/order_items’ni alohida insert qilish orqali emas, bitta DB transaction ichidagi RPC orqali bajarilsin.
2. Savat faol va joriy user’ga tegishli bo‘lishi, manzil joriy user’ga tegishli bo‘lishi, filial/business faol bo‘lishi tekshirilsin.
3. Har bir cart item uchun product/business/branch bog‘liqligi, `is_active`, `is_available`, stock va amaldagi narx DB’da qayta tekshirilsin. Client yuborgan price/total’ga ishonma.
4. Bir vaqtning o‘zida kelgan checkout’lar stock’ni manfiyga tushirmasin; inventory row locking/atomik update ishlatilsin. Order yaratish va stock ayirish bitta transaction bo‘lsin.
5. Checkout takroran yuborilsa ikki buyurtma yoki ikki marta stock kamayishi xavfini bahola; idempotency mexanizmi qo‘shish zarur bo‘lsa schema + frontend bilan yakunla.
6. Checkout muvaffaqiyatida order ID/number qaytarsin, savat holati to‘g‘ri yangilansin, UI buyurtma tasdiqlash sahifasiga o‘tsin. Xatoda savat yo‘qolmasin.
7. To‘lov usullari hozircha faqat MVP’da amalda mavjud variantlarni ko‘rsatsin. Click/Payme/bank card/payment ledger integratsiyasi mavjud bo‘lmasa, ularni ishlaydi deb ko‘rsatma. `cash_on_delivery`ni qo‘llash siyosatini aniq saqla.
8. `vimi_checkout` execute permission faqat `authenticated` uchun; `search_path=''`; `service_role` frontendga chiqmasin.
9. Checkout SQL bo‘yicha test/checklist yoz: bo‘sh savat, stock yetarli emas, noto‘g‘ri manzil, parallel checkout, muvaffaqiyat va rollback.

Eski Base44 checkout yo‘lini Base44 rejimida saqla. Build/lint/typecheck bajar.

---

## PROMPT 5 — Xaridor buyurtmalari va sotuvchi order-management

Buyer Orders va seller order pages/components, `getMyOrders`, `getMyOrder`, `getSellerOrders`, `getSellerOrder`, `getSellerDashboard`, `getSellerStatistics`, `updateOrderStatus` kabi mavjud Base44 funksiyalarni topib, Supabase muqobillarini yakunla.

Talablar:
1. Xaridor faqat o‘z order’lari va order_items snapshot’larini ko‘rsin. Sotuvchi faqat o‘ziga tegishli business/branch order’larini ko‘rsin.
2. `orders` va `order_items` select’lari mavjud UI formatiga moslashtirilsin; narx va nom order vaqtida saqlangan snapshot’dan o‘qilsin, keyinchalik product nomi/narxi o‘zgarsa eski order o‘zgarmasin.
3. Sotuvchi status o‘zgarishlari faqat ruxsat etilgan ketma-ketlikda bo‘lsin: `pending -> accepted/cancelled`, `accepted -> preparing/cancelled`, `preparing -> completed`. Xaridor faqat `pending` order’ni bekor qila olsin. Status o‘zgarishi `vimi_update_order_status` RPC orqali bo‘lsin.
4. Bekor qilishda ombor zaxirasi faqat bir marta qaytarilsin. Hozirgi SQL’da race condition/double restore xavfini tekshir; tranzaksiya va oldingi statusni lock bilan tekshirib tuzat.
5. Seller order detail’da buyer’ning kerakli snapshot ma’lumotlari va delivery address/coordinates faqat o‘sha order egasi bo‘lgan sotuvchiga ko‘rinsin.
6. Dashboard/statistics qiymatlarini DB’dan hisobla; client’dan yuborilgan business ID’ni owner tekshiruvisiz qabul qilma.
7. UI’da loading, empty, error, status badge va o‘zbekcha matnlar saqlansin.
8. RLS va RPC grant’larini testla. Boshqa biznes sotuvchisi order’ni ko‘ra/o‘zgartira olmasin.
9. Base44 fallback saqlansin; testlar yoki manual test rejasi qo‘sh.

Build/lint/typecheck bajar va haqiqiy natijani yoz.

---

## PROMPT 6 — Profil, bildirishnomalar va Storage

Profil sahifalari, `Notifications.jsx`, avatar/logo/product image upload komponentlari va `supabase/migrations/202610130001_storage_vimi_public.sql`ni tekshir.

Talablar:
1. Supabase rejimida profil ma’lumotlari `profiles`dan o‘qilsin va faqat ruxsat etilgan maydonlar yangilansin. Admin/role maydoni klientdan o‘zgartirilmasin.
2. Notifications: user o‘z bildirishnomalarini ko‘rsin, bittasini/o‘qilgan deb belgilash yoki mavjud UI’da hammasini o‘qilgan qilish ishlasin. `user_id` tekshiruvi va RLS bo‘lsin.
3. Storage: avatar, business logo va product image uchun bucket/path/policy’larni tekshir. Public read faqat haqiqatan ommaviy mahsulot/do‘kon rasmlari uchun; user avatarlari maxfiy bo‘lishi kerak bo‘lsa public bucket qilma. Upload’da fayl turi va hajmini tekshir; filename collision va path ownership’ni hisobga ol.
4. `VITE_STORAGE_PROVIDER` flag’i bilan Base44 fallback saqlansın. Supabase Storage ishlamayotganida xatoni yashirib muvaffaqiyat ko‘rsatma.
5. RLS/Storage policies uchun migration SQL va Supabase Dashboard qo‘lda bajariladigan ko‘rsatma yoz. SQL’ni mavjud policy’larni bilmasdan ko‘r-ko‘rona qayta-qayta qo‘llashga mos yoz.
6. Upload URL, signed URL, public URL va ruxsatlar UI’da to‘g‘ri ishlashini tekshir.

Test: foydalanuvchi boshqa user’ning avatarini almashtira olmasin, private object’ni ruxsatsiz o‘qiy olmasin, bildirishnoma izolyatsiyasi saqlansin. Build/lint/typecheck bajar.

---

## PROMPT 7 — Barcha Base44 bog‘liqliklarini qidirish va feature parity

Repository bo‘ylab `base44`, `entities`, `functions`, `auth`, `uploadFile`, Base44 SDK importlari va Base44 Vite plugin’ini qidir. Natijani feature bo‘yicha tasnifla.

Talablar:
1. Faqat haqiqatan migratsiya qilingan va testlangan yo‘llarni Supabase’ga yo‘naltir. Hali ko‘chmagan feature’lar uchun aniq fallback yoki aniq “mavjud emas” xabari bo‘lsin; xatolarni jim yutib yuborma.
2. `VITE_AUTH_PROVIDER` va `VITE_STORAGE_PROVIDER` kabi flag’lar yagona joyda tekshirilsin; noto‘g‘ri qiymat bo‘lsa development’da ogohlantirish chiqsin.
3. Supabase auth yoqilganda qolgan Base44 API chaqiruvlari foydalanuvchini tasodifan boshqa auth session bilan aralashtirmasin. Supabase user tokenini Base44 user deb qabul qilma.
4. Barcha sahifalar va context’larda Base44/Supabase rejimi bo‘yicha noaniq branch’larni top; `console.log` ichidagi PII/tokenlarni olib tashla.
5. Base44 SDK yoki Vite plugin’ini hozircha o‘chirib yuborma. Faqat auditdan so‘ng hech qaysi feature ishlatmayotgani va build tekshiruvlari tasdiqlasa alohida o‘zgarish taklif qil.
6. `docs/SUPABASE_MIGRATION_STATUS_UZ.md`ni yangila: migratsiya qilingan, qisman, Base44’da qolgan, qo‘lda sozlanadigan, tekshirilmagan feature’lar ro‘yxati.

Natijada `rg`/grep audit natijasi va har bir Base44 chaqiruvining holati berilsin. Build/lint/typecheck bajar.

---

## PROMPT 8 — RLS, SQL va xavfsizlik auditi

Supabase migrations va barcha query/RPC’lar uchun xavfsizlik auditi qil. Frontendni emas, database’ni asosiy trust boundary deb hisobla.

Tekshir va tuzat:
1. Har bir jadval uchun RLS yoqilganmi; `anon` va `authenticated`ga qanday huquqlar berilgan; policy’lar user/business ownership’ni to‘g‘ri tekshiradimi.
2. `profiles`, `addresses`, `carts`, `cart_items`, `orders`, `order_items`, `favorite_stores`, `saved_stores`, `notifications` shaxsiy ma’lumotlarini boshqa user o‘qiy/yoza olmasin.
3. Seller business/branch/product/inventory/order ma’lumotlarini faqat tegishli biznes egasi boshqarsin. Public catalog uchun faqat faol, ommaga ko‘rinishi kerak bo‘lgan ma’lumot ochiq bo‘lsin.
4. `SECURITY DEFINER` funksiyalarda `search_path` qat’iy o‘rnatilgan, `EXECUTE` huquqlari cheklangan, user/business ownership tekshiruvi mavjud bo‘lsin. `service_role`ni browser bundle’ga qo‘shma.
5. IDOR, privilege escalation, stock race, duplicate checkout, double cancellation/refund, public storage exposure va XSS xavflarini ko‘rib chiq.
6. Mavjud migration fayllarini allaqachon production’da ishlatilgan bo‘lishi mumkinligini hisobga olib, eski migration’ni jim o‘zgartirish o‘rniga zarur tuzatishlar uchun yangi timestamp migration yarat. Migration qayta bajarilganda xavfsiz bo‘lishiga harakat qil.
7. `docs/SECURITY_CHECKLIST_UZ.md` va kamida ikki foydalanuvchili RLS test ssenariylarini yoz.

Aniqlanmagan narsalarni “tekshirilmadi” deb belgila. Faqat koddan turib live project xavfsizligini tasdiqlama. Build/lint/typecheck bajar.

---

## PROMPT 9 — Build, lint, typecheck, test va xatolarni tuzatish

Endi repository’ni tekshiruvlardan o‘tkazib, aniqlangan xatolarni minimal o‘zgarish bilan tuzat.

Ketma-ket:
1. `npm ci`.
2. `npm run build`.
3. `npm run lint`.
4. `npm run typecheck`.
5. Mavjud test scriptlari/test framework bo‘lsa barcha testlarni ishga tushir; bo‘lmasa eng muhim auth/cart/checkout/RLS mantiqi uchun mos testlar qo‘sh.
6. Browser’da sinash mumkin bo‘lsa local preview’ni ishga tushirish bo‘yicha ko‘rsatma ber, ammo tashqi Supabase loginni avtomatik ishladi deb da’vo qilma.
7. Build/lint/typecheck xatolarini ildiz sababiga qarab tuzat. `eslint-disable`, `any`, `@ts-ignore`, testlarni o‘chirish yoki xatolarni yashirish orqali “yashil” natija yasama.
8. `npm audit` ishlatsa bo‘ladigan bo‘lsa natijasini tekshir; major dependency’larni avtomatik yangilab ilovani buzma. Muhim zaifliklar va xavfsiz update yo‘lini sanab o‘t.
9. `docs/RELEASE_TEST_PLAN_UZ.md`ga end-to-end manual test yoz: signup/login, Google OAuth, refresh/session, store browse/search, branch catalog, add/remove/update cart, address, checkout, buyer cancel, seller accept/prepare/complete/cancel, stock restore, favorites/saved stores, notifications, image upload, logout, unauthorized access.

Oxirida faqat haqiqatda bajarilgan komandalar va ularning exit code’larini ayt. Tashqi provider/credentials bo‘lmasa live test “tekshirilmagan” bo‘lsin.

---

## PROMPT 10 — Production deploy va release checklist

Kod va test auditidan keyingina release tayyorla. Hozirgi hosting tanlovini repository hujjatlari va foydalanuvchi konfiguratsiyasidan aniqlashga harakat qil; dalilsiz hosting yoki domenni taxmin qilma.

Talablar:
1. `README.md` va `docs/PRODUCTION_DEPLOY_UZ.md`ni yangila: build, deploy, SPA fallback/rewrites, environment variables, custom domain, HTTPS va rollback.
2. Production frontend’da faqat browser-safe `VITE_SUPABASE_URL` va publishable/anon key bo‘lsin. Supabase `service_role`, DB password, Google client secret hech qachon `VITE_` variable yoki browser bundle’da bo‘lmasin.
3. `VITE_AUTH_PROVIDER=supabase`ni faqat auth, cart, checkout, order va zarur profil oqimlari testdan o‘tgach yoqish bo‘yicha aniq ogohlantirish yoz. Agar feature parity to‘liq bo‘lmasa, Base44/Supabase rejimini aralashtirishning aniq cheklovlarini ko‘rsat.
4. Supabase Auth Site URL/Redirect URLs, Google OAuth provider, Storage policies, SQL migrations, production env va CORS bo‘yicha dashboard checklist yoz. Maxfiy qiymatlarni hujjatga yozma.
5. Database backup/restore, monitoring/logging, error reporting, migration rollback strategiyasi va launchdan keyingi smoke test rejasini yoz.
6. “Production-ready” deb faqat build va barcha critical end-to-end testlar muvaffaqiyatli bo‘lganda xulosa qil. Aks holda `release blocker`lar ro‘yxatini va nima uchun deployni to‘xtatish kerakligini yoz.
7. Play Market uchun APK/AAB bu React/Vite web ilovadan alohida ish: mavjud loyiha Android wrapper/native build bermasa, tayyor APK/AAB bor deb ko‘rsatma.

Oxirida release verdict faqat quyidagilardan biri bo‘lsin: `BLOCKED`, `READY FOR STAGING`, `READY FOR PRODUCTION`. Har bir verdictni tekshiruv dalillari bilan asosla.

---

## Yakuniy qoida — har promptdan keyin Copilotga yuborish

“Yakunlashdan oldin `git diff --check`, `npm run build`, `npm run lint`, `npm run typecheck`ni ishga tushir. Ishlamagan tekshiruvni yashirma. O‘zgartirilgan fayllar, migratsiya SQL’lari, qo‘lda bajariladigan Supabase Dashboard qadamlari, qolgan risklar va keyingi prompt uchun tayyorlik holatini sanab ber. `.env.local` va secretlarni commit qilma.”
